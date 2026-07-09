'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Plus, Clock, Briefcase, ShoppingCart, Globe, Users } from 'lucide-react';
import CreateMarketplaceProjectModal from '@/components/CreateMarketplaceProjectModal';
import { getMarketplaceProjects, createMarketplaceProject } from '@/app/actions/marketplaceActions';
import toast, { Toaster } from 'react-hot-toast';

const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    title: 'TinaCMS UI Recreation',
    client: 'Alex Mercer',
    status: 'In Progress',
    progress: 75,
    budget: '$12,500',
    deadline: '2026-06-15',
  },
  {
    id: 'proj-2',
    title: 'Next.js Corporate Site',
    client: 'TechNova Solutions',
    status: 'Planning',
    progress: 15,
    budget: '$8,000',
    deadline: '2026-07-01',
  },
  {
    id: 'proj-3',
    title: 'Vue 3 E-commerce Migration',
    client: 'Global Retail',
    status: 'In Review',
    progress: 95,
    budget: '$4,500',
    deadline: '2026-05-30',
  },
  {
    id: 'proj-4',
    title: 'Backend Node.js API Audit',
    client: 'FinTech Startup',
    status: 'Completed',
    progress: 100,
    budget: '$2,200',
    deadline: '2026-05-10',
  },
  {
    id: 'proj-5',
    title: 'SEO Dashboard UI Design',
    client: 'Marketing Pros',
    status: 'In Progress',
    progress: 45,
    budget: '$3,800',
    deadline: '2026-06-25',
  },
];

export default function PlatformClient({ platform }: { platform: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProjects() {
      try {
        const fetchedProjects = await getMarketplaceProjects(platform);
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Failed to load projects', error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [platform]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const getPlatformConfig = () => {
    const p = platform.toLowerCase();
    switch(p) {
      case 'upwork': return { 
        name: 'Upwork', 
        icon: <Briefcase size={24} className="text-emerald-500" />,
        accent: 'text-emerald-600 dark:text-emerald-400',
        bgAccent: 'bg-emerald-500',
        hoverBg: 'hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10'
      };
      case 'fiverr': return { 
        name: 'Fiverr', 
        icon: <ShoppingCart size={24} className="text-fuchsia-500" />,
        accent: 'text-fuchsia-600 dark:text-fuchsia-400',
        bgAccent: 'bg-fuchsia-500',
        hoverBg: 'hover:bg-fuchsia-500/5 dark:hover:bg-fuchsia-500/10'
      };
      case 'freelancer': return { 
        name: 'Freelancer', 
        icon: <Globe size={24} className="text-cyan-500" />,
        accent: 'text-cyan-600 dark:text-cyan-400',
        bgAccent: 'bg-cyan-500',
        hoverBg: 'hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10'
      };
      case 'direct': default: return { 
        name: 'Direct Clients', 
        icon: <Users size={24} className="text-indigo-500" />,
        accent: 'text-indigo-600 dark:text-indigo-400',
        bgAccent: 'bg-indigo-500',
        hoverBg: 'hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10'
      };
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Planning': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'In Review': return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      default: return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    }
  };

  const pConf = getPlatformConfig();

  return (
    <div className="min-h-screen p-4 md:p-8 neu-base-bg text-slate-200 relative overflow-hidden">


      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Navigation Breadcrumb */}
        <Link 
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-jakarta font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Folders
        </Link>

        {/* Dynamic Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 neu-flat rounded-[2rem] p-6 md:p-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 neu-pressed rounded-2xl flex items-center justify-center">
              {pConf.icon}
            </div>
            <div>
              <h1 className="flex items-center gap-3">
                {pConf.name} Projects
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Manage active pipeline and deliverables</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="w-full pl-11 pr-4 py-3 neu-pressed rounded-xl text-sm font-inter text-[15px] focus:outline-none text-slate-200 placeholder-slate-400 transition-all"
              />
            </div>
            
            {/* Action Button */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 neu-button text-indigo-500 font-jakarta font-bold rounded-xl hover:-translate-y-0.5 transition-all text-sm w-full sm:w-auto flex-shrink-0"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        {/* High-Density List View (Data Table) */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 neu-pressed rounded-3xl">
            <p className="text-slate-500 dark:text-gray-400">No projects found. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {/* Column Headers (Hidden on small screens) */}
            <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-2 text-xs font-jakarta font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-2">
              <div className="col-span-4">Project Name</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Progress</div>
              <div className="col-span-1">Budget</div>
              <div className="col-span-2 text-right">Deadline</div>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-5"
            >
              {projects.map((project) => (
                <motion.div
                  key={project._id}
                  variants={itemVariants}
                  className="group block relative"
                >
                  <Link href={`/marketplace/${platform.toLowerCase()}/${project._id}`} className="block relative z-10 neu-flat rounded-[1.5rem] p-6 md:p-7 hover:-translate-y-1.5 transition-all duration-300">
                    
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 neu-pressed opacity-0 group-hover:opacity-100 rounded-[1.5rem] pointer-events-none transition-all duration-500" />
                    
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:items-center relative z-10">
                      
                      {/* Project Title & Client */}
                      <div className="col-span-4">
                        <h3 className={`mb-2 group-hover:${pConf.accent} transition-colors line-clamp-1`}>
                          {project.title}
                        </h3>
                        <p className="text-sm font-inter font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Users size={14} className="opacity-70" /> {project.clientDetails?.clientName || 'Unknown Client'}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center">
                        <span className={`px-4 py-1.5 text-[11px] uppercase tracking-widest font-jakarta font-black rounded-xl border ${getStatusBadge(project.status)} shadow-sm`}>
                          {project.status}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="col-span-3 flex items-center">
                        <div className="flex flex-col w-full max-w-[180px] gap-2">
                          <div className="flex justify-between items-center text-xs font-jakarta font-bold text-slate-500 dark:text-slate-400">
                            <span className="uppercase tracking-widest text-[10px]">Completion</span>
                            <span className="font-mono">{project.progress}%</span>
                          </div>
                          <div className="h-2.5 w-full neu-pressed rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${pConf.bgAccent} shadow-sm transition-all duration-1000 ease-out`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="col-span-1 flex items-center">
                        <span className="font-mono font-black text-slate-700 dark:text-slate-200 neu-pressed px-3.5 py-1.5 rounded-xl">
                          {project.budget}
                        </span>
                      </div>

                      {/* Deadline */}
                      <div className="col-span-2 flex items-center md:justify-end">
                        <div className="flex items-center gap-2.5 text-sm font-jakarta font-bold text-slate-600 dark:text-slate-300 neu-pressed px-4 py-2.5 rounded-xl transition-colors">
                          <Clock size={16} className={pConf.accent} />
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(project.deadline))}
                        </div>
                      </div>
                      
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      <Toaster position="bottom-right" />

      <CreateMarketplaceProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultPlatform={platform}
        onSave={async (data) => {
          const loadingToast = toast.loading('Creating project...');
          
          const initialTasks = data.tasks && data.tasks.length > 0
            ? data.tasks.map((t: string, idx: number) => ({ id: Date.now() + idx, title: t, completed: false }))
            : [];
            
          const newProject = {
            title: data.title,
            clientId: data.clientId,
            clientDetails: data.clientDetails || { clientName: data.clientName || 'Unknown Client' },
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            status: 'Planning',
            progress: 0,
            budget: data.budget ? `$${data.budget}` : '$0',
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            deadline: data.deadline ? new Date(data.deadline) : undefined,
            scope: data.scope,
            tasks: initialTasks,
            milestones: [],
            files: []
          };
          
          const res = await createMarketplaceProject(newProject);
          if (res.success) {
            toast.success('Project created!', { id: loadingToast });
            setIsModalOpen(false);
            router.push(`/marketplace/${platform.toLowerCase()}/${res.data._id}`);
          } else {
            toast.error(res.error || 'Failed to create project', { id: loadingToast });
          }
        }}
      />
    </div>
  );
}
