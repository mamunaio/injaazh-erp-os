'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, List, Clock, Calendar, MoreVertical, MessageSquare, Paperclip, ChevronRight } from 'lucide-react';

const COLUMNS = ['Planning', 'In Progress', 'In Review', 'Completed'];

const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    title: 'SensorySpace Solutions - CRO Strategy',
    column: 'In Progress',
    tags: ['SEO', 'Next.js'],
    progress: 65,
    deadline: 'Next Week',
    avatars: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2'],
    comments: 4,
    attachments: 2,
  },
  {
    id: 'proj-2',
    title: 'Injaazh Corporate Homepage Redesign',
    column: 'Planning',
    tags: ['UI/UX', 'Glassmorphism'],
    progress: 0,
    deadline: 'In 3 Weeks',
    avatars: ['https://i.pravatar.cc/150?u=3'],
    comments: 12,
    attachments: 5,
  },
  {
    id: 'proj-3',
    title: 'E-commerce Migration',
    column: 'In Review',
    tags: ['Laravel', 'High-end Dev'],
    progress: 90,
    deadline: 'Tomorrow',
    avatars: ['https://i.pravatar.cc/150?u=4', 'https://i.pravatar.cc/150?u=5', 'https://i.pravatar.cc/150?u=6'],
    comments: 28,
    attachments: 14,
  }
];

export default function ProjectsClient() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-slate-800 dark:text-slate-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-600 dark:from-white dark:to-gray-400">
            Project Delivery
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage execution, timelines, and deliverables</p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-white/70 dark:bg-purple-950/10 backdrop-blur-md border border-slate-200 dark:border-purple-500/10 rounded-xl overflow-hidden p-1">
            <button 
              onClick={() => setViewMode('board')}
              className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${viewMode === 'board' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'}`}
            >
              <LayoutGrid size={16} /> Board
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'}`}
            >
              <List size={16} /> List
            </button>
          </div>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all text-sm">
            <Plus size={18} /> New Project
          </button>
        </div>
      </div>

      {/* Kanban Board Layout */}
      {viewMode === 'board' && (
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
          {COLUMNS.map((column) => {
            const columnProjects = MOCK_PROJECTS.filter(p => p.column === column);
            
            return (
              <div 
                key={column} 
                className="w-full min-w-[320px] max-w-[360px] flex-shrink-0 flex flex-col snap-center rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 overflow-hidden"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-800 dark:text-slate-200">{column}</h2>
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                      {columnProjects.length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <Plus size={18} />
                  </button>
                </div>

                {/* Column Body */}
                <div className="p-4 flex-1 overflow-y-auto">
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col gap-4"
                  >
                    {columnProjects.map((project) => {
                      const isOverdueOrSoon = project.deadline.toLowerCase().includes('tomorrow') || project.deadline.toLowerCase().includes('today');
                      
                      return (
                        <motion.div
                          key={project.id}
                          variants={itemVariants}
                          className="group p-5 bg-white/90 dark:bg-purple-950/20 backdrop-blur-2xl border border-slate-200 dark:border-purple-500/10 rounded-2xl shadow-sm hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)] hover:border-indigo-300 dark:hover:border-purple-500/40 transition-all duration-300 cursor-grab active:cursor-grabbing relative"
                        >
                          {/* Tags & Options */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-wrap gap-2">
                              {project.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-slate-800 dark:text-white mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            {project.title}
                          </h3>

                          {/* Progress Bar */}
                          {project.progress > 0 && (
                            <div className="mb-5">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-slate-500 dark:text-gray-400 font-medium">Progress</span>
                                <span className="text-slate-700 dark:text-gray-300 font-bold">{project.progress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative"
                                  style={{ width: `${project.progress}%` }}
                                >
                                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Footer Metrics */}
                          <div className="flex items-center justify-between mt-auto border-t border-slate-100 dark:border-white/5 pt-4">
                            {/* Deadline */}
                            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg ${isOverdueOrSoon ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20' : 'text-slate-500 dark:text-gray-400'}`}>
                              {isOverdueOrSoon ? <Clock size={12} /> : <Calendar size={12} />}
                              {project.deadline}
                            </div>

                            {/* Avatars & Meta */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 text-slate-400 dark:text-gray-500 text-xs">
                                {project.comments > 0 && <span className="flex items-center gap-1"><MessageSquare size={12} /> {project.comments}</span>}
                                {project.attachments > 0 && <span className="flex items-center gap-1"><Paperclip size={12} /> {project.attachments}</span>}
                              </div>
                              
                              <div className="flex -space-x-2">
                                {project.avatars.map((avatar, idx) => (
                                  <img 
                                    key={idx} 
                                    src={avatar} 
                                    alt="Assignee" 
                                    className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Accent line on hover */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
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
