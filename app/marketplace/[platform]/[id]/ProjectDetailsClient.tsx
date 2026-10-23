'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Briefcase, ShoppingCart, Globe, Users, CheckCircle2, Circle, UploadCloud, FileText, Search, Filter, DollarSign, Check, MoreHorizontal, Pencil, Archive, Trash, ChevronDown, Lock, XCircle, AlertTriangle, Plus, File, Download, CheckSquare, User, Copy, Edit3, Sparkles } from 'lucide-react';
import EditMarketplaceProjectModal from '@/components/EditMarketplaceProjectModal';
import { getMarketplaceProjectById, updateMarketplaceProject, deleteMarketplaceProject } from '@/app/actions/marketplaceActions';
import DatePicker from '@/components/ui/DatePicker';
import toast, { Toaster } from 'react-hot-toast';

const INITIAL_TASKS = [
  { id: 1, title: 'Project Kickoff & Discovery Call', completed: true },
  { id: 2, title: 'Figma Wireframing (Low Fidelity)', completed: true },
  { id: 3, title: 'Figma UI Design (High Fidelity)', completed: false },
  { id: 4, title: 'Next.js Frontend Scaffolding', completed: false },
  { id: 5, title: 'Backend API Integration', completed: false },
  { id: 6, title: 'Final Review & Handover', completed: false },
];

export default function ProjectDetailsClient({ platform, projectId }: { platform: string; projectId: string }) {
  // State Management
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Details' | 'Payments' | 'Tasklists' | 'Files'>('Details');
  const [loading, setLoading] = useState(true);
  
  // Dropdown States
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('Planning');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  // Project Data State
  const [projectData, setProjectData] = useState<any>({
    title: "",
    client: "",
    budget: "",
    scope: "",
    startDate: "",
    deadline: ""
  });

  // Milestones State
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<{ id?: number | string, description: string, date: string, status: string, amount: number } | null>(null);
  const [milestoneDate, setMilestoneDate] = useState('');

  // Task State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{ id?: number | string, title: string, completed: boolean } | null>(null);

  // Files State
  const [files, setFiles] = useState<any[]>([]);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const activeFileCategoryState = useState('All Files');
  const activeFileCategory = activeFileCategoryState[0];
  const setActiveFileCategory = activeFileCategoryState[1];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopiedScope, setIsCopiedScope] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const router = useRouter();

  useEffect(() => {
    async function loadProject() {
      try {
        const data = await getMarketplaceProjectById(projectId);
        if (data) {
          setProjectData({
            ...data,
            title: data.title || '',
            client: data.clientDetails?.clientName || data.client || '',
            clientName: data.clientDetails?.clientName || data.client || '',
            clientId: data.clientId ? String(data.clientId) : '',
            platform: data.platform || platform,
            budget: data.budget || '',
            scope: data.scope || '',
            startDate: data.startDate || '',
            deadline: data.deadline || '',
            tasks: data.tasks || []
          });
          setCurrentStatus(data.status || 'Planning');
          setTasks(data.tasks || []);
          setMilestones(data.milestones || []);
          setFiles(data.files || []);
        } else {
          router.push(`/marketplace/${platform.toLowerCase()}`);
        }
      } catch (error) {
        console.error("Failed to load project details", error);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [projectId, platform, router]);

  // Unified save handler
  const saveToServer = async (updates: any, silent = false): Promise<boolean> => {
    try {
      if (!silent) toast.loading('Saving...', { id: 'save' });
      const res = await updateMarketplaceProject(projectId, updates);
      if (res.success) {
        if (!silent) toast.success('Saved successfully', { id: 'save' });
        return true;
      } else {
        if (!silent) toast.error(res.error || 'Failed to save', { id: 'save' });
        return false;
      }
    } catch (e: any) {
      if (!silent) toast.error(e?.message || 'Failed to save', { id: 'save' });
      return false;
    }
  };

  // Helper to generate a clean project code from title
  const generateProjectCode = (title: string, id: string) => {
    if (!title) return `PRJ-${id.slice(-4).toUpperCase()}`;
    const words = title.split(/\s+/).filter(Boolean);
    let code = '';
    if (words.length >= 2) {
      code = words.map(w => w[0].toUpperCase()).join('').replace(/[^A-Z]/g, '');
    } else {
      code = title.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    }
    const prefix = code.slice(0, 5) || 'PRJ';
    const suffix = id.slice(-4).toUpperCase();
    return `${prefix}-${suffix}`;
  };

  // Derived State
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercentage = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : (currentStatus === 'Completed' ? 100 : 0);

  const handleTaskToggle = (id: number | string) => {
    const newTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    
    // Also save progress automatically when a task is toggled
    const newCompleted = newTasks.filter(t => t.completed).length;
    const newProgress = Math.round((newCompleted / newTasks.length) * 100) || 0;
    saveToServer({ tasks: newTasks, progress: newProgress }, true);
  };

  const getPlatformConfig = () => {
    const p = platform.toLowerCase();
    switch(p) {
      case 'upwork': return { 
        name: 'Upwork', 
        icon: <Briefcase size={14} />,
        color: '#10B981',
        glowColor: 'rgba(16,185,129,0.25)',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        accent: 'text-emerald-600 dark:text-emerald-400'
      };
      case 'fiverr': return { 
        name: 'Fiverr', 
        icon: <ShoppingCart size={14} />,
        color: '#EC4899',
        glowColor: 'rgba(236,72,153,0.25)',
        badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30',
        accent: 'text-pink-600 dark:text-pink-400'
      };
      case 'freelancer': return { 
        name: 'Freelancer', 
        icon: <Globe size={14} />,
        color: '#00E5FF',
        glowColor: 'rgba(0,229,255,0.25)',
        badge: 'bg-[#00E5FF]/10 text-cyan-600 dark:text-[#00E5FF] border-[#00E5FF]/30',
        accent: 'text-cyan-600 dark:text-[#00E5FF]'
      };
      case 'direct': default: return { 
        name: 'Direct Client', 
        icon: <Users size={14} />,
        color: '#6324FC',
        glowColor: 'rgba(99,36,252,0.25)',
        badge: 'bg-[#6324FC]/10 text-indigo-600 dark:text-[#A78BFA] border-[#6324FC]/30',
        accent: 'text-indigo-600 dark:text-[#A78BFA]'
      };
    }
  };

  const updateStatus = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setIsStatusOpen(false);
    
    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length > 0
      ? Math.round((completedCount / tasks.length) * 100)
      : (newStatus === 'Completed' ? 100 : 0);
      
    saveToServer({ status: newStatus, progress }, true);
  };

  const pConf = getPlatformConfig();

  const filteredFiles = files.filter(f => 
    (activeFileCategory === 'All Files' || f.category === activeFileCategory) &&
    f.name.toLowerCase().includes(fileSearchQuery.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFile = e.target.files[0];
      const uploadToast = toast.loading('Uploading file...');
      
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await res.json();
        
        if (data.success) {
          const newFile = {
            id: Date.now(),
            name: uploadedFile.name,
            size: (uploadedFile.size / 1024 > 1024) 
              ? (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB' 
              : (uploadedFile.size / 1024).toFixed(0) + ' KB',
            category: activeFileCategory === 'All Files' ? 'Documents' : activeFileCategory,
            date: new Date().toISOString().split('T')[0],
            url: data.url
          };
          
          const updatedFiles = [newFile, ...files];
          setFiles(updatedFiles);
          await saveToServer({ files: updatedFiles }, true);
          toast.success('File uploaded successfully', { id: uploadToast });
        } else {
          toast.error(data.error || 'Upload failed', { id: uploadToast });
        }
      } catch (error) {
        console.error('File upload error', error);
        toast.error('Upload failed', { id: uploadToast });
      }
    }
  };
  
  const getDynamicBadgeStyle = () => {
    switch (currentStatus) {
      case 'Planning':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Completed':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Cancelled':
        return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'Private':
        return 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/30';
      case 'In Progress':
      default:
        return pConf.badge;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-white flex flex-col items-center relative overflow-hidden">

      {/* Ambient background glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] blur-[140px] pointer-events-none opacity-40 dark:opacity-20"
        style={{
          background: `radial-gradient(ellipse at top, ${pConf.color}, transparent 70%)`
        }}
      />
      
      <div className="w-full max-w-6xl relative z-10">
        {/* Executive Glass Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link 
            href={`/marketplace/${platform.toLowerCase()}`}
            className="group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/60 dark:hover:border-[#00E5FF]/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-heading font-bold shadow-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,36,252,0.25)] hover:-translate-x-1"
          >
            <div className="w-5 h-5 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-[#6324FC]/15 dark:group-hover:bg-[#00E5FF]/15 flex items-center justify-center text-secondary group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-all duration-300">
              <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span>Back to {pConf.name} Directory</span>
            <span className="text-secondary/40 font-mono text-[11px]">•</span>
            <span className="text-secondary font-mono text-[11px]">Deliverables Hub</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-[#0a0a0d]/60 backdrop-blur-md border border-black/5 dark:border-white/5 text-xs font-mono text-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
            <span>Marketplace</span>
            <span className="opacity-40">/</span>
            <span>{pConf.name}</span>
            <span className="opacity-40">/</span>
            <span className="text-slate-900 dark:text-white font-bold">{generateProjectCode(projectData.title, projectId)}</span>
          </div>
        </div>

        {/* Dynamic Header & Overview Panel (Executive Glass Banner) */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 mb-8 relative flex flex-col lg:flex-row gap-6 lg:gap-8 justify-between shadow-lg dark:shadow-2xl overflow-hidden">
          {/* Top Neon Glow line */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2.5px]"
            style={{ 
              backgroundImage: `linear-gradient(to right, transparent, ${pConf.color}, transparent)`,
              boxShadow: `0 0 14px ${pConf.color}`
            }}
          />

          {/* Left: Info */}
          <div className="flex-1 relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-3 relative" ref={statusRef}>
              <button 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold flex items-center gap-2 border ${getDynamicBadgeStyle()} hover:opacity-90 transition-all outline-none shadow-sm cursor-pointer`}
              >
                {pConf.icon} {pConf.name} · {currentStatus} <ChevronDown size={14} className="opacity-60" />
              </button>
              
              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#0e0e13] border border-black/10 dark:border-white/15 rounded-xl z-[100] p-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-1">
                      <button onClick={() => updateStatus('Planning')} className="w-full px-3 py-2 rounded-lg text-left text-xs font-heading font-bold text-amber-600 dark:text-amber-400 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-all cursor-pointer">
                        <Clock size={14} /> Planning
                      </button>
                      <button onClick={() => updateStatus('In Progress')} className="w-full px-3 py-2 rounded-lg text-left text-xs font-heading font-bold text-blue-600 dark:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-all cursor-pointer">
                        <Circle size={14} /> In Progress
                      </button>
                      <button onClick={() => updateStatus('Completed')} className="w-full px-3 py-2 rounded-lg text-left text-xs font-heading font-bold text-emerald-600 dark:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-all cursor-pointer">
                        <CheckCircle2 size={14} /> Completed
                      </button>
                      <button onClick={() => updateStatus('Cancelled')} className="w-full px-3 py-2 rounded-lg text-left text-xs font-heading font-bold text-red-600 dark:text-red-400 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-all cursor-pointer">
                        <XCircle size={14} /> Cancelled
                      </button>
                      <div className="h-px w-full bg-black/5 dark:bg-white/5 my-0.5" />
                      <button onClick={() => updateStatus('Private')} className="w-full px-3 py-2 rounded-lg text-left text-xs font-heading font-bold text-slate-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-all cursor-pointer">
                        <Lock size={14} /> Private
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="text-xs font-mono text-secondary px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                ID: {generateProjectCode(projectData.title, projectId)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {projectData.title}
            </h1>
            <p className="text-lg sm:text-xl font-heading font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 font-mono">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <DollarSign size={16} />
              </span>
              <span>{projectData.budget}</span>
              <span className="text-xs font-sans text-secondary font-normal">Allocated Budget</span>
            </p>
          </div>

          {/* Right: Client & Progress Widgets */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 relative z-10 justify-end">
            {/* Client Profile Widget */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 min-w-[160px] flex flex-col justify-center relative overflow-hidden group transition-all shadow-sm">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User size={12} className={pConf.accent} /> Client Account
              </p>
              <p className="text-base font-heading font-bold text-slate-900 dark:text-white truncate">{projectData.client || 'Direct Client'}</p>
              {projectData.deadline && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-secondary bg-black/5 dark:bg-white/5 w-fit px-2 py-0.5 rounded-md border border-black/5 dark:border-white/5">
                  <Clock size={11} className={pConf.accent} />
                  <span>
                    Due: {new Date(projectData.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Global Progress Widget */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 flex flex-col items-center justify-center min-w-[130px] relative overflow-hidden group transition-all shadow-sm">
              <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider mb-2">Completion</p>
              
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                  <path
                    className="text-black/10 dark:text-white/10"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    className={pConf.accent}
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - progressPercentage }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {progressPercentage}%
                </div>
              </div>
            </div>

            {/* Project Actions Button */}
            <div className="relative z-50" ref={actionsRef}>
              <button 
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 flex items-center justify-center text-secondary hover:text-slate-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 transition-all outline-none shadow-sm cursor-pointer"
                title="Project Actions"
              >
                <MoreHorizontal size={18} />
              </button>

              <AnimatePresence>
                {isActionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#0e0e13] border border-black/10 dark:border-white/15 rounded-xl z-[100] p-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { setIsEditModalOpen(true); setIsActionsOpen(false); }} className="w-full px-3 py-2 rounded-lg text-left text-xs font-heading font-bold text-slate-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3 transition-all cursor-pointer">
                        <Pencil size={15} className="text-secondary" /> Edit Project Details
                      </button>
                      <button onClick={() => { setIsArchiveModalOpen(true); setIsActionsOpen(false); }} className="w-full px-3 py-2 rounded-lg text-left text-xs font-heading font-bold text-slate-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3 transition-all cursor-pointer">
                        <Archive size={15} className="text-secondary" /> Archive Project
                      </button>
                      <div className="h-px w-full bg-black/5 dark:bg-white/5 my-0.5" />
                      <button onClick={() => { setIsDeleteModalOpen(true); setIsActionsOpen(false); }} className="w-full px-3 py-2 rounded-lg text-left text-xs font-heading font-bold text-red-600 hover:bg-red-500/10 dark:text-red-400 flex items-center gap-3 transition-all cursor-pointer">
                        <Trash size={15} className="text-red-500 dark:text-red-400" /> Delete Project
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sliding Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-2xl mb-8 w-max overflow-x-auto max-w-full shadow-sm">
          {['Details', 'Payments', 'Tasklists', 'Files'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className="relative px-4 sm:px-6 py-2.5 text-xs font-heading font-bold rounded-xl outline-none transition-all duration-300 flex-shrink-0 cursor-pointer"
            >
              <span className={`relative z-10 flex items-center gap-2 ${activeTab === tab ? 'text-indigo-600 dark:text-[#00E5FF]' : 'text-secondary hover:text-slate-900 dark:hover:text-white'}`}>
                {tab === 'Details' && <FileText size={14} className={activeTab === tab ? 'opacity-100' : 'opacity-70'} />}
                {tab === 'Payments' && <DollarSign size={14} className={activeTab === tab ? 'opacity-100' : 'opacity-70'} />}
                {tab === 'Tasklists' && <CheckSquare size={14} className={activeTab === tab ? 'opacity-100' : 'opacity-70'} />}
                {tab === 'Files' && <UploadCloud size={14} className={activeTab === tab ? 'opacity-100' : 'opacity-70'} />}
                {tab}
              </span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabDetails"
                  className="absolute inset-0 bg-slate-100 dark:bg-white/10 border border-black/5 dark:border-white/15 rounded-xl shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="rounded-3xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 min-h-[500px] relative overflow-hidden shadow-sm dark:shadow-xl">
          <AnimatePresence mode="wait">
            
            {activeTab === 'Tasklists' && (
              <motion.div
                key="Tasklists"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 md:p-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">Project Deliverables</h2>
                    <span className="px-3 py-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-full text-xs font-mono text-secondary">
                      {completedTasks} of {tasks.length} Completed
                    </span>
                  </div>
                  <button 
                    onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                    className="px-4 py-2 rounded-xl text-xs font-heading font-bold bg-[#6324FC] hover:bg-[#521bd9] text-white shadow-[0_0_15px_rgba(99,36,252,0.35)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </div>
                
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => handleTaskToggle(task.id)}
                      className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                        task.completed 
                          ? 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-75' 
                          : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 hover:border-[#6324FC]/40 hover:-translate-y-0.5 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                          task.completed 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_#10B981]' 
                            : 'border-black/20 dark:border-white/20 group-hover:border-[#6324FC]'
                        }`}>
                          {task.completed && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-medium transition-colors ${
                          task.completed 
                            ? 'text-secondary line-through' 
                            : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {task.title}
                        </span>
                      </div>
                      
                      {/* Task Actions */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsTaskModalOpen(true); }}
                          className="p-1.5 text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit Task"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setTasks(tasks.filter(t => t.id !== task.id)); }}
                          className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center p-10 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                      <p className="text-xs font-heading text-secondary font-bold">No tasks found. Click &quot;Add Task&quot; to begin tracking milestones.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'Details' && (
              <motion.div
                key="Details"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="p-6 md:p-10"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Scope Header Card */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-3.5">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: `${pConf.color}15`,
                          border: `1px solid ${pConf.color}35`,
                          color: pConf.color,
                        }}
                      >
                        <FileText size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">
                            Project Scope & Statement of Work
                          </h2>
                          <span 
                            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block"
                            style={{
                              backgroundColor: `${pConf.color}15`,
                              color: pConf.color,
                              border: `1px solid ${pConf.color}30`
                            }}
                          >
                            Active SOW
                          </span>
                        </div>
                        <p className="text-xs font-sans text-secondary mt-0.5">
                          Deliverable specifications, system architecture, milestones & contract parameters.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {projectData.scope && (
                        <button
                          type="button"
                          onClick={() => {
                            const plainText = projectData.scope.replace(/<[^>]*>/g, '').trim();
                            navigator.clipboard.writeText(plainText);
                            setIsCopiedScope(true);
                            toast.success('Scope statement copied to clipboard');
                            setTimeout(() => setIsCopiedScope(false), 2000);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 transition-all shadow-sm"
                          title="Copy scope text to clipboard"
                        >
                          {isCopiedScope ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          <span>{isCopiedScope ? 'Copied' : 'Copy SOW'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold text-white transition-all shadow-md hover:brightness-110 active:scale-95"
                        style={{
                          backgroundColor: pConf.color,
                          boxShadow: `0 0 14px ${pConf.glowColor}`
                        }}
                        title="Edit scope details or re-generate with AI"
                      >
                        <Edit3 size={13} />
                        <span>Edit Scope</span>
                      </button>
                    </div>
                  </div>

                  {/* Scope Content Render */}
                  {!projectData.scope || !projectData.scope.trim() ? (
                    <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
                      <FileText size={32} className="mx-auto text-secondary mb-3 opacity-40" />
                      <h3 className="text-sm font-heading font-bold text-slate-800 dark:text-slate-200">
                        No project scope defined yet
                      </h3>
                      <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                        Use the AI Copilot to generate a client-ready scope statement and sprint deliverables.
                      </p>
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="mt-4 px-4 py-2 rounded-xl text-xs font-heading font-bold text-white transition-all shadow-md hover:brightness-110 flex items-center gap-1.5 mx-auto"
                        style={{ backgroundColor: pConf.color }}
                      >
                        <Sparkles size={13} />
                        <span>✨ Generate Scope with AI</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const rawScope = projectData.scope.trim();
                        
                        // Check if content has bullet points or clean newlines
                        const bulletItems = rawScope
                          .split(/\n+/)
                          .map((line: string) => line.trim())
                          .filter(Boolean);
                        
                        const hasBullets = bulletItems.some((line: string) => 
                          line.startsWith('•') || line.startsWith('-') || line.startsWith('*')
                        );
                        
                        if (hasBullets) {
                          return (
                            <div className="grid grid-cols-1 gap-3.5">
                              {bulletItems.map((item: string, idx: number) => {
                                const cleanItem = item.replace(/^[•\-*]\s*/, '').trim();
                                const colonIndex = cleanItem.indexOf(':');
                                const hasTitle = colonIndex > 0 && colonIndex < 45;
                                const title = hasTitle ? cleanItem.slice(0, colonIndex).trim() : null;
                                const desc = hasTitle ? cleanItem.slice(colonIndex + 1).trim() : cleanItem;

                                return (
                                  <div 
                                    key={idx}
                                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0c0d12] border border-black/5 dark:border-white/10 shadow-sm transition-all hover:border-black/15 dark:hover:border-white/20 flex items-start gap-3.5 group"
                                  >
                                    <div 
                                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-transform group-hover:scale-105"
                                      style={{
                                        backgroundColor: `${pConf.color}15`,
                                        color: pConf.color,
                                        border: `1px solid ${pConf.color}30`
                                      }}
                                    >
                                      <CheckCircle2 size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {title && (
                                        <h4 
                                          className="text-xs font-heading font-bold uppercase tracking-wider mb-1"
                                          style={{ color: pConf.color }}
                                        >
                                          {title}
                                        </h4>
                                      )}
                                      <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
                                        {desc}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        // Intelligent Segmentation: If it's a dense wall of text, split into logical cards
                        const sentences = rawScope.split(/(?<=[.!?])\s+/).filter(Boolean);
                        const chunks: string[] = [];
                        let current: string[] = [];
                        
                        sentences.forEach((s: string) => {
                          current.push(s);
                          if (current.length >= 2) {
                            chunks.push(current.join(' '));
                            current = [];
                          }
                        });
                        if (current.length > 0) chunks.push(current.join(' '));

                        const phaseLabels = [
                          'Project Overview & Mission',
                          'Architecture & UI/UX Design System',
                          'Core Deliverables & Specifications',
                          'Scope Boundaries & Integrations',
                          'Quality Assurance & Handover'
                        ];

                        return (
                          <div className="grid grid-cols-1 gap-3.5">
                            {chunks.map((chunk: string, idx: number) => {
                              const label = phaseLabels[idx] || `Deliverable Phase ${idx + 1}`;
                              return (
                                <div 
                                  key={idx}
                                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-[#0c0d12] border border-black/5 dark:border-white/10 shadow-sm transition-all hover:border-black/15 dark:hover:border-white/20 flex items-start gap-3.5 group"
                                >
                                  <div 
                                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-transform group-hover:scale-105"
                                    style={{
                                      backgroundColor: `${pConf.color}15`,
                                      color: pConf.color,
                                      border: `1px solid ${pConf.color}30`
                                    }}
                                  >
                                    <CheckCircle2 size={14} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 
                                      className="text-xs font-heading font-bold uppercase tracking-wider mb-1"
                                      style={{ color: pConf.color }}
                                    >
                                      {label}
                                    </h4>
                                    <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
                                      {chunk}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'Payments' && (
              <motion.div
                key="Payments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 md:p-8"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-heading font-extrabold text-slate-900 dark:text-white">Milestone Payments</h2>
                    <p className="text-xs font-sans text-secondary">Payment escrow, milestone releases, and financial tracking.</p>
                  </div>
                  <button 
                    onClick={() => { 
                      setEditingMilestone(null); 
                      setMilestoneDate('');
                      setIsMilestoneModalOpen(true); 
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-heading font-bold bg-[#6324FC] hover:bg-[#521bd9] text-white shadow-[0_0_15px_rgba(99,36,252,0.35)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus size={14} /> Add Milestone
                  </button>
                </div>
                
                <div className="overflow-hidden rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#0e0e13] border-b border-black/10 dark:border-white/10 text-slate-600 dark:text-secondary uppercase tracking-wider font-heading font-bold">
                      <tr>
                        <th className="p-4">Description</th>
                        <th className="p-4 w-32">Date</th>
                        <th className="p-4 w-28">Status</th>
                        <th className="p-4 text-right w-32">Amount</th>
                        <th className="p-4 text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {milestones.map((milestone) => (
                        <tr key={milestone.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors group">
                          <td className="p-4 text-slate-900 dark:text-slate-100 font-semibold">{milestone.description}</td>
                          <td className="p-4 text-secondary font-mono">{new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-[11px] font-heading font-bold rounded-lg border ${
                              milestone.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                              milestone.status === 'Pending' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                              'bg-black/5 text-secondary dark:bg-white/5 border-black/10 dark:border-white/10'
                            }`}>
                              {milestone.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-900 dark:text-white font-bold font-mono text-right">${milestone.amount.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { 
                                  setEditingMilestone(milestone); 
                                  setMilestoneDate(milestone.date);
                                  setIsMilestoneModalOpen(true); 
                                }}
                                className="p-1.5 text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit Milestone"
                              >
                                <Pencil size={13} />
                              </button>
                              <button 
                                onClick={() => setMilestones(milestones.filter(m => m.id !== milestone.id))}
                                className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete Milestone"
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {milestones.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-secondary italic">No milestones defined yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'Files' && (
              <motion.div
                key="Files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 min-h-[400px]"
              >
                {/* Filters Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-4 flex-shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input 
                      type="text" 
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      placeholder="Search files..." 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl text-xs outline-none transition-colors" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-2">
                    <p className="text-[10px] font-heading font-bold text-secondary uppercase tracking-wider mb-2 px-2">Categories</p>
                    {['All Files', 'Design Assets', 'Documents', 'Invoices'].map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => setActiveFileCategory(cat)}
                        className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
                          activeFileCategory === cat 
                            ? 'bg-[#6324FC] text-white shadow-sm' 
                            : 'text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Files Area */}
                <div className="flex-1 flex flex-col gap-6">
                  {/* Drag and Drop Zone */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-black/15 dark:border-white/15 hover:border-[#6324FC] dark:hover:border-[#00E5FF] bg-slate-50/50 dark:bg-[#060608]/50 flex flex-col items-center justify-center p-8 text-center group transition-all cursor-pointer shadow-sm"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                    <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-[#6324FC] transition-all">
                      <UploadCloud size={22} className="text-secondary group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors" />
                    </div>
                    <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white mb-1">Upload Project Assets</h3>
                    <p className="text-secondary text-xs max-w-sm">
                      Drag and drop your files here, or click to browse. Supports PDF, PNG, JPG, ZIP up to 50MB.
                    </p>
                  </div>

                  {/* File List */}
                  <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[300px]">
                    {filteredFiles.map(file => (
                      <div key={file.id} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-2xl transition-all hover:-translate-y-0.5 shadow-sm">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                            <File size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-heading font-bold text-slate-900 dark:text-slate-100">{file.name}</p>
                            <div className="flex items-center gap-2.5 text-[11px] font-mono text-secondary mt-0.5">
                              <span>{file.size}</span>
                              <span className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/20" />
                              <span>{new Date(file.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/20" />
                              <span className="font-heading font-bold">{file.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {file.url ? (
                            <a href={file.url} download className="p-2 text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors inline-flex cursor-pointer">
                              <Download size={14} />
                            </a>
                          ) : (
                            <button className="p-2 text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                              <Download size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              const updatedFiles = files.filter(f => f.id !== file.id);
                              setFiles(updatedFiles);
                              saveToServer({ files: updatedFiles }, true);
                            }}
                            className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete File"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredFiles.length === 0 && (
                      <div className="text-center p-8 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                        <p className="text-secondary text-xs font-heading font-bold">No files found matching criteria.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Edit Project Modal */}
      <EditMarketplaceProjectModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        project={projectData}
        onSave={async (updatedData) => {
          const taskList = updatedData.tasks && updatedData.tasks.length > 0
            ? updatedData.tasks.map((t: string, idx: number) => ({ 
                id: Date.now() + idx, 
                title: t, 
                completed: false 
              }))
            : projectData.tasks || [];

          const updatePayload: any = {
            title: updatedData.title,
            clientDetails: updatedData.clientDetails || { clientName: updatedData.clientName || 'Unknown Client' },
            budget: updatedData.budget ? (updatedData.budget.startsWith('$') ? updatedData.budget : `$${updatedData.budget}`) : projectData.budget,
            scope: updatedData.scope,
            startDate: updatedData.startDate ? new Date(updatedData.startDate) : undefined,
            deadline: updatedData.deadline ? new Date(updatedData.deadline) : undefined,
            tasks: taskList,
          };

          if (updatedData.clientId && updatedData.clientId.trim() !== '') {
            updatePayload.clientId = updatedData.clientId;
          }

          const success = await saveToServer(updatePayload);
          if (success) {
            setProjectData((prev: any) => ({
              ...prev,
              ...updatePayload,
              client: updatePayload.clientDetails?.clientName || prev?.client,
              scope: updatePayload.scope,
            }));
            setTasks(taskList);
            setIsEditModalOpen(false);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#EF4444]" />
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500 shadow-sm">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white mb-2">Delete Project</h3>
              <p className="text-xs font-sans text-secondary mb-6 leading-relaxed">
                Are you sure? All deliverables, milestone payments, and attached files will be permanently erased. This action cannot be reversed.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-heading font-bold text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#121218] border border-black/10 dark:border-white/10 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    const loadingToast = toast.loading('Deleting project...');
                    const res = await deleteMarketplaceProject(projectId);
                    if (res.success) {
                      toast.success('Project deleted', { id: loadingToast });
                      router.push(`/marketplace/${platform.toLowerCase()}`);
                    } else {
                      toast.error(res.error || 'Failed to delete project', { id: loadingToast });
                    }
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-heading font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Archive Confirmation Modal */}
      <AnimatePresence>
        {isArchiveModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsArchiveModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_12px_#F59E0B]" />
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500 shadow-sm">
                <Archive size={28} />
              </div>
              <h3 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white mb-2">Archive Project?</h3>
              <p className="text-xs font-sans text-secondary mb-6 leading-relaxed">
                Archiving will hide this project from active platform boards. You can restore it later from workspace settings.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-heading font-bold text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#121218] border border-black/10 dark:border-white/10 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => router.push(`/marketplace/${platform.toLowerCase()}`)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-heading font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  Archive It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Milestone Add/Edit Modal */}
      <AnimatePresence>
        {isMilestoneModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMilestoneModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent shadow-[0_0_12px_#6324FC]" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">
                  {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
                </h3>
                <button 
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="p-1.5 rounded-lg text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newMilestone = {
                  id: editingMilestone?.id || Date.now(),
                  description: formData.get('description') as string,
                  date: formData.get('date') as string,
                  status: formData.get('status') as string,
                  amount: Number(formData.get('amount'))
                };

                if (editingMilestone) {
                  const updatedMilestones = milestones.map(m => m.id === editingMilestone.id ? newMilestone : m);
                  setMilestones(updatedMilestones);
                  saveToServer({ milestones: updatedMilestones }, true);
                } else {
                  const updatedMilestones = [...milestones, newMilestone];
                  setMilestones(updatedMilestones);
                  saveToServer({ milestones: updatedMilestones }, true);
                }
                setIsMilestoneModalOpen(false);
              }} className="flex flex-col gap-4">
                
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <input 
                    name="description" 
                    required 
                    defaultValue={editingMilestone?.description} 
                    type="text" 
                    placeholder="e.g. Initial UI & Discovery Release" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl text-xs text-slate-900 dark:text-white outline-none transition-colors" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5">Amount ($)</label>
                    <input 
                      name="amount" 
                      required 
                      defaultValue={editingMilestone?.amount} 
                      type="number" 
                      placeholder="1500" 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl text-xs text-slate-900 dark:text-white outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5">Expected Date</label>
                    <DatePicker 
                      name="date"
                      value={milestoneDate}
                      onChange={(val) => setMilestoneDate(val)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingMilestone?.status || 'Pending'} 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer transition-colors"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Locked">Locked</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-3">
                  <button 
                    type="button"
                    onClick={() => setIsMilestoneModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-heading font-bold text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#121218] border border-black/10 dark:border-white/10 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-[#6324FC] hover:bg-[#521bd9] text-white text-xs font-heading font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] cursor-pointer"
                  >
                    {editingMilestone ? 'Save Changes' : 'Create Milestone'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Add/Edit Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent shadow-[0_0_12px_#6324FC]" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">
                  {editingTask ? 'Edit Task' : 'Add Task'}
                </h3>
                <button 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-1.5 rounded-lg text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <XCircle size={18} />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newTask = {
                  id: editingTask?.id || Date.now(),
                  title: formData.get('title') as string,
                  completed: editingTask ? editingTask.completed : false
                };

                if (editingTask) {
                  const updatedTasks = tasks.map(t => t.id === editingTask.id ? { ...t, title: newTask.title } : t);
                  setTasks(updatedTasks);
                  saveToServer({ tasks: updatedTasks }, true);
                } else {
                  const updatedTasks = [...tasks, newTask];
                  setTasks(updatedTasks);
                  const newProgress = Math.round((updatedTasks.filter(t => t.completed).length / updatedTasks.length) * 100) || 0;
                  saveToServer({ tasks: updatedTasks, progress: newProgress }, true);
                }
                setIsTaskModalOpen(false);
              }} className="flex flex-col gap-4">
                
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 dark:text-slate-300 mb-1.5">Task Deliverable</label>
                  <input 
                    name="title" 
                    required 
                    defaultValue={editingTask?.title} 
                    type="text" 
                    placeholder="e.g. Design System Implementation & Tokens" 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 focus:border-[#6324FC] rounded-xl text-xs text-slate-900 dark:text-white outline-none transition-colors" 
                  />
                </div>

                <div className="flex gap-3 mt-3">
                  <button 
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-heading font-bold text-slate-700 dark:text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#121218] border border-black/10 dark:border-white/10 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-[#6324FC] hover:bg-[#521bd9] text-white text-xs font-heading font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,36,252,0.4)] cursor-pointer"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
