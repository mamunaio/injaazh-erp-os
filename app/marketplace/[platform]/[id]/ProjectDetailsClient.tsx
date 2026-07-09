'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Briefcase, ShoppingCart, Globe, Users, CheckCircle2, Circle, UploadCloud, FileText, Search, Filter, DollarSign, Check, MoreHorizontal, Pencil, Archive, Trash, ChevronDown, Lock, XCircle, AlertTriangle, Plus, File, Download, CheckSquare, User } from 'lucide-react';
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
            title: data.title || '',
            client: data.clientDetails?.clientName || '',
            budget: data.budget || '',
            scope: data.scope || '',
            startDate: data.startDate || '',
            deadline: data.deadline || ''
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
  const saveToServer = async (updates: any, silent = false) => {
    try {
      if (!silent) toast.loading('Saving...', { id: 'save' });
      const res = await updateMarketplaceProject(projectId, updates);
      if (res.success) {
        if (!silent) toast.success('Saved successfully', { id: 'save' });
      } else {
        if (!silent) toast.error('Failed to save', { id: 'save' });
      }
    } catch (e) {
      if (!silent) toast.error('Failed to save', { id: 'save' });
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
        icon: <Briefcase size={16} />,
        badge: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        accent: 'text-emerald-600 dark:text-emerald-400'
      };
      case 'fiverr': return { 
        name: 'Fiverr', 
        icon: <ShoppingCart size={16} />,
        badge: 'bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400',
        accent: 'text-fuchsia-600 dark:text-fuchsia-400'
      };
      case 'freelancer': return { 
        name: 'Freelancer', 
        icon: <Globe size={16} />,
        badge: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
        accent: 'text-cyan-600 dark:text-cyan-400'
      };
      case 'direct': default: return { 
        name: 'Direct Client', 
        icon: <Users size={16} />,
        badge: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
        accent: 'text-indigo-600 dark:text-indigo-400'
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
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20';
      case 'Completed':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20';
      case 'Cancelled':
        return 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20';
      case 'Private':
        return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20';
      case 'In Progress':
      default:
        return pConf.badge;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 neu-base-bg text-slate-200 flex flex-col items-center relative overflow-hidden">

      
      <div className="w-full max-w-6xl relative z-10">
        {/* Navigation Breadcrumb */}
        <Link 
          href={`/marketplace/${platform.toLowerCase()}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-6 group font-bold"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </Link>

        {/* Dynamic Header & Overview Panel */}
        <div className="neu-flat rounded-[2.5rem] p-8 md:p-10 mb-8 relative flex flex-col md:flex-row gap-8 justify-between">
          
          {/* Left: Info */}
          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-3 mb-4 relative" ref={statusRef}>
              <button 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${getDynamicBadgeStyle()} hover:opacity-80 transition-all outline-none`}
              >
                {pConf.icon} {pConf.name} {currentStatus} <ChevronDown size={14} className="opacity-50" />
              </button>
              
              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-48 neu-flat rounded-xl z-[100] p-1.5"
                  >
                    <div className="flex flex-col gap-1">
                      <button onClick={() => updateStatus('Planning')} className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium text-amber-600 dark:text-amber-400 hover:neu-pressed flex items-center gap-2 transition-all">
                        <Clock size={14} /> Planning
                      </button>
                      <button onClick={() => updateStatus('In Progress')} className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:neu-pressed flex items-center gap-2 transition-all">
                        <Circle size={14} /> In Progress
                      </button>
                      <button onClick={() => updateStatus('Completed')} className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:neu-pressed flex items-center gap-2 transition-all">
                        <CheckCircle2 size={14} /> Completed
                      </button>
                      <button onClick={() => updateStatus('Cancelled')} className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium text-red-600 dark:text-red-400 hover:neu-pressed flex items-center gap-2 transition-all">
                        <XCircle size={14} /> Cancelled
                      </button>
                      <div className="h-px w-full bg-slate-200/50 dark:bg-white/5 my-0.5" />
                      <button onClick={() => updateStatus('Private')} className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium text-slate-600 dark:text-gray-400 hover:neu-pressed flex items-center gap-2 transition-all">
                        <Lock size={14} /> Private
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">ID: {generateProjectCode(projectData.title, projectId)}</span>
            </div>
            <h1 className="mb-2">
              {projectData.title}
            </h1>
            <p className="text-xl font-medium text-slate-600 dark:text-gray-300 flex items-center gap-1.5">
              <DollarSign size={20} className={pConf.accent} /> {projectData.budget} Budget
            </p>
          </div>

          {/* Right: Client & Progress Widgets */}
          <div className="flex items-center gap-4 sm:gap-6 relative z-10 min-w-min justify-end">
            {/* Client Profile Widget */}
            <div className="neu-pressed rounded-2xl p-5 min-w-[160px] flex flex-col justify-center relative overflow-hidden group transition-all">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <User size={12} /> Client Details
              </p>
              <p className="text-lg font-black text-slate-800 dark:text-white truncate">{projectData.client || 'Direct Client'}</p>
              {projectData.deadline && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-black/30 w-fit px-2.5 py-1 rounded-md">
                  <Clock size={12} className={pConf.accent} />
                  <span>
                    Due: {new Date(projectData.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Global Progress Widget */}
            <div className="neu-pressed rounded-2xl p-5 flex flex-col items-center justify-center min-w-[140px] relative overflow-hidden group transition-all hidden sm:flex">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Progress</p>
              
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-200 dark:text-white/10"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Animated Progress Circle */}
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
                <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-slate-800 dark:text-white">
                  {progressPercentage}%
                </div>
              </div>
            </div>

            {/* Project Actions Button (Sleek Horizontal Alignment) */}
            <div className="relative z-50" ref={actionsRef}>
              <button 
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:neu-pressed text-slate-500 dark:text-gray-400 transition-all outline-none"
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
                    className="absolute top-full right-0 mt-2 w-56 neu-flat rounded-xl z-[100] p-1.5"
                  >
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { setIsEditModalOpen(true); setIsActionsOpen(false); }} className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium text-slate-700 dark:text-gray-200 hover:neu-pressed flex items-center gap-3 transition-all">
                        <Pencil size={16} className="text-slate-400" /> Edit Project Details
                      </button>
                      <button onClick={() => { setIsArchiveModalOpen(true); setIsActionsOpen(false); }} className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium text-slate-700 dark:text-gray-200 hover:neu-pressed flex items-center gap-3 transition-all">
                        <Archive size={16} className="text-slate-400" /> Archive Project
                      </button>
                      <div className="h-px w-full bg-slate-200/50 dark:bg-white/5 my-0.5" />
                      <button onClick={() => { setIsDeleteModalOpen(true); setIsActionsOpen(false); }} className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium text-red-600 hover:neu-pressed hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-3 transition-all">
                        <Trash size={16} className="text-red-500 dark:text-red-400" /> Delete Project
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sliding Navigation Tabs */}
        <div className="flex neu-flat rounded-2xl p-1.5 mb-8 w-max overflow-x-auto max-w-full">
          {['Details', 'Payments', 'Tasklists', 'Files'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className="relative px-5 md:px-7 py-2.5 text-sm font-bold rounded-xl outline-none transition-all duration-300 flex-shrink-0"
            >
              <span className={`relative z-10 flex items-center gap-2 ${activeTab === tab ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                {tab === 'Details' && <FileText size={16} className={activeTab === tab ? 'opacity-100' : 'opacity-70'} />}
                {tab === 'Payments' && <DollarSign size={16} className={activeTab === tab ? 'opacity-100' : 'opacity-70'} />}
                {tab === 'Tasklists' && <CheckSquare size={16} className={activeTab === tab ? 'opacity-100' : 'opacity-70'} />}
                {tab === 'Files' && <UploadCloud size={16} className={activeTab === tab ? 'opacity-100' : 'opacity-70'} />}
                {tab}
              </span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabDetails"
                  className="absolute inset-0 bg-white dark:bg-white/10 border border-white dark:border-white/20 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="neu-flat rounded-[2.5rem] min-h-[500px] relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {activeTab === 'Tasklists' && (
              <motion.div
                key="Tasklists"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="">Project Deliverables</h2>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-sm font-medium text-slate-500 dark:text-gray-400">{completedTasks} of {tasks.length} Completed</span>
                  </div>
                  <button 
                    onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                    className="px-4 py-2 neu-button text-indigo-500 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Task
                  </button>
                </div>
                
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => handleTaskToggle(task.id)}
                      className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${task.completed ? 'neu-pressed' : 'neu-flat hover:-translate-y-1'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-gray-600 group-hover:border-indigo-400 dark:group-hover:border-purple-400'}`}>
                          {task.completed && <Check size={14} strokeWidth={3} />}
                        </div>
                        <span className={`text-base font-medium transition-colors ${task.completed ? 'text-slate-400 dark:text-gray-500 line-through decoration-slate-300 dark:decoration-gray-600' : 'text-slate-700 dark:text-slate-200'}`}>
                          {task.title}
                        </span>
                      </div>
                      
                      {/* Task Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsTaskModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setTasks(tasks.filter(t => t.id !== task.id)); }}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
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
                className="p-8 md:p-12"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50 dark:border-white/10">
                    <div className="w-12 h-12 neu-pressed text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h2 className="">Project Brief</h2>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Complete scope, requirements, and deliverables.</p>
                    </div>
                  </div>
                  
                  <div 
                    className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-indigo-600 dark:prose-a:text-indigo-400 hover:prose-a:text-indigo-500 prose-img:rounded-2xl prose-img:shadow-lg prose-indigo"
                    dangerouslySetInnerHTML={{ __html: projectData.scope || '<p class="text-slate-400 italic">No project scope provided.</p>' }}
                  />
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
                className="p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="">Milestone Payments</h2>
                  <button 
                    onClick={() => { 
                      setEditingMilestone(null); 
                      setMilestoneDate('');
                      setIsMilestoneModalOpen(true); 
                    }}
                    className="px-4 py-2 neu-button text-indigo-500 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Milestone
                  </button>
                </div>
                
                <div className="overflow-hidden rounded-2xl neu-pressed">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400">
                      <tr>
                        <th className="p-4 font-semibold">Description</th>
                        <th className="p-4 font-semibold w-32">Date</th>
                        <th className="p-4 font-semibold w-24">Status</th>
                        <th className="p-4 font-semibold text-right w-32">Amount</th>
                        <th className="p-4 font-semibold text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {milestones.map((milestone) => (
                        <tr key={milestone.id} className="hover:bg-white dark:hover:bg-white/5 transition-colors group">
                          <td className="p-4 text-slate-200 font-medium">{milestone.description}</td>
                          <td className="p-4 text-slate-500 dark:text-gray-400">{new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                              milestone.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 
                              milestone.status === 'Pending' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' :
                              'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-gray-400 border-slate-200 dark:border-white/10'
                            }`}>
                              {milestone.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-200 font-bold text-right">${milestone.amount.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { 
                                  setEditingMilestone(milestone); 
                                  setMilestoneDate(milestone.date);
                                  setIsMilestoneModalOpen(true); 
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => setMilestones(milestones.filter(m => m.id !== milestone.id))}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {milestones.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-gray-400 italic">No milestones defined.</td>
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
                className="p-8 flex flex-col md:flex-row gap-8 min-h-[400px]"
              >
                {/* Filters Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-4 flex-shrink-0">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      placeholder="Search files..." 
                      className="w-full pl-9 pr-4 py-2 neu-pressed rounded-xl text-sm focus:outline-none" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">Categories</p>
                    {['All Files', 'Design Assets', 'Documents', 'Invoices'].map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => setActiveFileCategory(cat)}
                        className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFileCategory === cat ? 'neu-pressed text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-gray-300 hover:neu-flat'}`}
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
                    className="w-full rounded-3xl neu-pressed flex flex-col items-center justify-center p-8 text-center group transition-all cursor-pointer"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                    <div className="w-12 h-12 neu-flat rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                      <UploadCloud size={24} className="text-slate-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <h3 className="mb-1">Upload Project Assets</h3>
                    <p className="text-slate-500 dark:text-gray-400 text-xs max-w-sm">
                      Drag and drop your files here, or click to browse. Supports PDF, PNG, JPG, ZIP up to 50MB.
                    </p>
                  </div>

                  {/* File List */}
                  <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[300px]">
                    {filteredFiles.map(file => (
                      <div key={file.id} className="group flex items-center justify-between p-4 neu-flat rounded-2xl transition-all hover:-translate-y-1">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                            <File size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200">{file.name}</p>
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">
                              <span>{file.size}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-600" />
                              <span>{new Date(file.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-600" />
                              <span>{file.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {file.url ? (
                            <a href={file.url} download className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors inline-flex">
                              <Download size={16} />
                            </a>
                          ) : (
                            <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                              <Download size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              const updatedFiles = files.filter(f => f.id !== file.id);
                              setFiles(updatedFiles);
                              saveToServer({ files: updatedFiles }, true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredFiles.length === 0 && (
                      <div className="text-center p-8 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-200 border-dashed dark:border-white/10">
                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">No files found.</p>
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

          const updatePayload = {
            title: updatedData.title,
            clientId: updatedData.clientId,
            clientDetails: updatedData.clientDetails || { clientName: updatedData.clientName || 'Unknown Client' },
            budget: updatedData.budget ? `$${updatedData.budget}` : projectData.budget,
            scope: updatedData.scope,
            startDate: updatedData.startDate ? new Date(updatedData.startDate) : undefined,
            deadline: updatedData.deadline ? new Date(updatedData.deadline) : undefined,
            tasks: taskList,
          };

          await saveToServer(updatePayload);
          setIsEditModalOpen(false);
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
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md neu-flat rounded-3xl p-8 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 neu-pressed rounded-full flex items-center justify-center mb-4 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2">Delete Project</h3>
              <p className="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed">
                Are you sure? All milestones, tasks, and files will be permanently lost. This action cannot be undone.
              </p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-gray-300 neu-button rounded-xl transition-colors"
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
                  className="flex-1 py-3 neu-button text-red-500 text-sm font-bold rounded-xl transition-colors"
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
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md neu-flat rounded-3xl p-8 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 neu-pressed rounded-full flex items-center justify-center mb-4 text-amber-500">
                <Archive size={32} />
              </div>
              <h3 className="mb-2">Archive Project?</h3>
              <p className="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed">
                Archiving will hide this project from active boards. You can restore it later from the settings.
              </p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-gray-300 neu-button rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => router.push(`/marketplace/${platform.toLowerCase()}`)}
                  className="flex-1 py-3 neu-button text-amber-500 text-sm font-bold rounded-xl transition-colors"
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
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg neu-flat rounded-3xl p-8 flex flex-col"
            >
              <h3 className="mb-6">
                {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
              </h3>
              
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
              }} className="flex flex-col gap-5">
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Description</label>
                  <input name="description" required defaultValue={editingMilestone?.description} type="text" placeholder="e.g. Initial Deposit" className="w-full px-4 py-3 neu-pressed rounded-xl focus:outline-none dark:text-white transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Amount ($)</label>
                    <input name="amount" required defaultValue={editingMilestone?.amount} type="number" placeholder="3750" className="w-full px-4 py-3 neu-pressed rounded-xl focus:outline-none dark:text-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Expected Date</label>
                    <DatePicker 
                      name="date"
                      value={milestoneDate}
                      onChange={(val) => setMilestoneDate(val)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Status</label>
                  <select name="status" defaultValue={editingMilestone?.status || 'Pending'} className="w-full px-4 py-3 neu-pressed rounded-xl focus:outline-none dark:text-white transition-all appearance-none">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Locked">Locked</option>
                  </select>
                </div>

                <div className="flex gap-4 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsMilestoneModalOpen(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-gray-300 neu-button rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 neu-button text-indigo-500 text-sm font-bold rounded-xl transition-colors"
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
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg neu-flat rounded-3xl p-8 flex flex-col"
            >
              <h3 className="mb-6">
                {editingTask ? 'Edit Task' : 'Add Task'}
              </h3>
              
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
              }} className="flex flex-col gap-5">
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Task Title</label>
                  <input name="title" required defaultValue={editingTask?.title} type="text" placeholder="e.g. Design System Implementation" className="w-full px-4 py-3 neu-pressed rounded-xl focus:outline-none dark:text-white transition-all" />
                </div>

                <div className="flex gap-4 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-gray-300 neu-button rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 neu-button text-indigo-500 text-sm font-bold rounded-xl transition-colors"
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
