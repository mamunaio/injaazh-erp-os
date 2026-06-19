'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, List } from 'lucide-react';
import KanbanBoard from '@/components/Kanban/KanbanBoard';
import CreateProjectModal from '@/components/CreateProjectModal';
import EditProjectModal from '@/components/EditProjectModal';
import { createProject, updateProject, deleteProject } from '@/app/actions/projectActions';
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

  const handleCardClick = (projectId: string) => {
    const project = initialProjects.find((p) => p._id === projectId);
    if (project) {
      setSelectedProject(project);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateProject = async (projectId: string, data: any) => {
    const result = await updateProject(projectId, data);
    if (result.success) {
      router.refresh();
    } else {
      alert('Failed to update project: ' + (result.error || 'Unknown error'));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      const result = await deleteProject(projectId);
      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedProject(null);
        router.refresh();
      } else {
        alert('Failed to delete project: ' + (result.error || 'Unknown error'));
      }
    }
  };

  return (
    <div className="min-h-screen neu-base-bg p-4 md:p-8 text-slate-800 dark:text-slate-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="mb-3">
            Project Delivery
          </h1>
          <p className="text-[15px] font-inter leading-relaxed tracking-wide text-slate-600 dark:text-gray-400">Manage execution, timelines, and deliverables</p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex neu-pressed p-1 rounded-xl overflow-hidden">
            <button 
              onClick={() => setViewMode('board')}
              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-jakarta font-bold transition-all ${viewMode === 'board' ? 'neu-flat text-indigo-500 dark:text-indigo-400' : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'}`}
            >
              <LayoutGrid size={18} /> Board
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-jakarta font-bold transition-all ${viewMode === 'list' ? 'neu-flat text-indigo-500 dark:text-indigo-400' : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'}`}
            >
              <List size={18} /> List
            </button>
          </div>

          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 neu-button text-indigo-500 dark:text-indigo-400 font-jakarta font-bold rounded-xl transition-all text-sm"
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
        onDeleteProject={handleDeleteProject}
      />

      {/* Kanban Board Layout */}
      {viewMode === 'board' && (
        <KanbanBoard 
          initialProjects={initialProjects}
          onCardClick={handleCardClick}
        />
      )}
      
      {/* Placeholder for List View */}
      {viewMode === 'list' && (
        <div className="flex items-center justify-center h-64 neu-flat rounded-3xl text-slate-500 dark:text-gray-400 font-inter text-[15px]">
          List View coming soon...
        </div>
      )}
    </div>
  );
}
