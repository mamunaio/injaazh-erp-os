'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, List } from 'lucide-react';
import ProjectBoard from './ProjectBoard';
import CreateProjectModal from '@/components/CreateProjectModal';
import EditProjectModal from '@/components/EditProjectModal';
import { createProject, updateProject } from '@/app/actions/projectActions';
import { useRouter } from 'next/navigation';

interface ProjectsClientProps {
  initialProjects: any[];
}

export default function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const handleCreateProject = async (data: any) => {
    const result = await createProject(data);
    if (result.success) {
      router.refresh();
    } else {
      alert('Failed to create project: ' + (result.error || 'Unknown error'));
    }
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (projectId: string, data: any) => {
    const result = await updateProject(projectId, data);
    if (result.success) {
      router.refresh();
    } else {
      alert('Failed to update project: ' + (result.error || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 p-4 md:p-8 text-slate-800 dark:text-slate-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 mb-2">
            Project Delivery
          </h1>
          <p className="text-slate-600 dark:text-gray-400 text-base">Manage execution, timelines, and deliverables</p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-white/80 dark:bg-purple-950/20 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-500/20 rounded-xl overflow-hidden p-1 shadow-lg">
            <button 
              onClick={() => setViewMode('board')}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all ${viewMode === 'board' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
            >
              <LayoutGrid size={18} /> Board
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
            >
              <List size={18} /> List
            </button>
          </div>

          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/40 transition-all text-sm"
          >
            <Plus size={20} /> New Project
          </button>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Edit Project Modal */}
      <EditProjectModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onUpdateProject={handleUpdateProject}
      />

      {/* Kanban Board Layout */}
      {viewMode === 'board' && (
        <ProjectBoard 
          initialProjects={initialProjects}
          onEdit={handleEditProject}
        />
      )}
      
      {/* Placeholder for List View */}
      {viewMode === 'list' && (
        <div className="flex items-center justify-center h-64 bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl text-slate-500 dark:text-gray-400">
          List View coming soon...
        </div>
      )}
    </div>
  );
}
