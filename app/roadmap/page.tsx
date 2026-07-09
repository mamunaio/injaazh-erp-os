'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Map, Loader2, Plus } from 'lucide-react';
import { CategoryCard } from './components';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { getRoadmapProjects } from '@/app/actions/roadmapActions';
import { ProjectDrawer, IRoadmapProjectWithLogs } from './ProjectDrawer';
import { AddProjectModal } from './AddProjectModal';

export default function RoadmapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<IRoadmapProjectWithLogs | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchProjects = async () => {
    const result = await getRoadmapProjects();
    if (result.success) {
      setProjects(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Group projects by category
  const groupedProjects = projects.reduce((acc, project) => {
    const cat = acc.find((c: any) => c.category === project.category);
    if (cat) {
      cat.projects.push(project);
    } else {
      acc.push({ category: project.category, projects: [project] });
    }
    return acc;
  }, []);

  const handleProjectClick = (project: IRoadmapProjectWithLogs) => {
    setSelectedProject(project);
  };

  const handleDrawerClose = () => {
    setSelectedProject(null);
  };

  const handleProjectUpdate = () => {
    fetchProjects();
    // Also update the selected project in the drawer if needed
    if (selectedProject) {
      getRoadmapProjects().then(result => {
        if (result.success) {
          const updated = result.data.find((p: any) => p._id === selectedProject._id);
          if (updated) setSelectedProject(updated);
        }
      });
    }
  };

  return (
    <div className="flex h-screen neu-base-bg overflow-hidden font-sans text-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">

        <Topbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 relative z-20 scrollbar-hide">
          <div className="max-w-5xl mx-auto space-y-10 pb-20">
            {/* Header Section */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 neu-pressed text-violet-500 rounded-lg">
                    <Map size={24} />
                  </div>
                  <h1 className="text-slate-800 dark:text-white font-bold text-3xl">
                    Product Roadmap
                  </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  Upcoming Task List & Software Systems Development Plan
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full neu-pressed rounded-2xl pl-12 pr-4 py-3.5 text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none transition-all"
                />
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 neu-button text-violet-500 px-5 py-3.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Project</span>
              </button>
            </motion.div>

            {/* Roadmap Categories */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-violet-500" size={32} />
              </div>
            ) : (
              <div className="space-y-6">
                {groupedProjects.map((category: any, index: number) => (
                  <CategoryCard 
                    key={category.category} 
                    categoryData={category} 
                    searchQuery={searchQuery}
                    onProjectClick={handleProjectClick}
                  />
                ))}

                {groupedProjects.every((category: any) => 
                  category.projects.filter((p: any) => p.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0
                ) && searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <p className="text-slate-400 text-lg">No projects found matching "{searchQuery}"</p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchProjects();
        }}
      />

      <ProjectDrawer 
        project={selectedProject} 
        isOpen={!!selectedProject} 
        onClose={handleDrawerClose}
        onUpdate={handleProjectUpdate}
      />
    </div>
  );
}
