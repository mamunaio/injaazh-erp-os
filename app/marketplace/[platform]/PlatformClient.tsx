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
    <div className="min-h-screen p-4 md:p-8 text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <Link 
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors mb-6 group font-medium"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Folders
        </Link>

        {/* Dynamic Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
              {pConf.icon}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 capitalize">
                {pConf.name} Projects
              </h1>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage active pipeline and deliverables</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white/70 dark:bg-purple-950/20 backdrop-blur-xl border border-slate-200 dark:border-purple-500/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
            
            {/* Action Button */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all text-sm w-full sm:w-auto flex-shrink-0"
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
          <div className="text-center py-20 bg-white/70 dark:bg-purple-950/10 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/10 rounded-3xl shadow-sm">
            <p className="text-slate-500 dark:text-gray-400">No projects found. Create one to get started!</p>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-purple-950/10 backdrop-blur-3xl border border-slate-200 dark:border-purple-500/10 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-gray-400">
                  <th className="px-6 py-5">Project Details</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Progress</th>
                  <th className="px-6 py-5">Budget</th>
                  <th className="px-6 py-5">Deadline</th>
                </tr>
              </thead>
              
              <motion.tbody 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-slate-100 dark:divide-white/5"
              >
                {projects.map((project) => (
                  <motion.tr 
                    key={project._id}
                    variants={itemVariants}
                    className={`group cursor-pointer transition-all duration-300 ${pConf.hoverBg}`}
                  >
                    <td className="p-0">
                      <Link href={`/marketplace/${platform.toLowerCase()}/${project._id}`} className="block px-6 py-5 outline-none">
                        <div>
                          <p className={`font-bold text-base text-slate-800 dark:text-white mb-1 group-hover:${pConf.accent} transition-colors`}>
                            {project.title}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Users size={14} /> {project.clientDetails?.clientName || 'Unknown Client'}
                          </p>
                        </div>
                      </Link>
                    </td>
                    
                    <td className="p-0">
                      <Link href={`/marketplace/${platform.toLowerCase()}/${project._id}`} className="block px-6 py-5 outline-none h-full w-full">
                        <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${getStatusBadge(project.status)}`}>
                          {project.status}
                        </span>
                      </Link>
                    </td>

                    <td className="p-0">
                      <Link href={`/marketplace/${platform.toLowerCase()}/${project._id}`} className="block px-6 py-5 outline-none h-full w-full">
                        <div className="flex items-center gap-3 w-40">
                          <span className="text-xs font-bold text-slate-600 dark:text-gray-300 w-8">{project.progress}%</span>
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${pConf.bgAccent}`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    </td>

                    <td className="p-0">
                      <Link href={`/marketplace/${platform.toLowerCase()}/${project._id}`} className="block px-6 py-5 outline-none h-full w-full">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{project.budget}</span>
                      </Link>
                    </td>

                    <td className="p-0">
                      <Link href={`/marketplace/${platform.toLowerCase()}/${project._id}`} className="block px-6 py-5 outline-none h-full w-full">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-gray-300">
                          <Clock size={14} className="text-slate-400" />
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(project.deadline))}
                        </div>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
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
            clientDetails: { clientName: data.client },
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
