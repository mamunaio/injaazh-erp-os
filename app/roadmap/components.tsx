'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FolderGit2, CircleCheckBig, Clock, CircleDashed, PauseCircle, Search } from 'lucide-react';
import { RoadmapCategory, Project, ProjectStatus } from './data';

const StatusBadge = ({ status }: { status: ProjectStatus }) => {
  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'In Progress':
        return { color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: Clock };
      case 'Completed':
        return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CircleCheckBig };
      case 'On Hold':
        return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: PauseCircle };
      case 'Planning':
      default:
        return { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: CircleDashed };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      <Icon size={14} />
      {status}
    </span>
  );
};

export const CategoryCard = ({ 
  categoryData, 
  searchQuery,
  onProjectClick
}: { 
  categoryData: any;
  searchQuery: string;
  onProjectClick: (project: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Filter projects based on search query
  const filteredProjects = categoryData.projects.filter((project: any) => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If there's a search query and no projects match, hide the category entirely
  if (searchQuery && filteredProjects.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 bg-black/20 hover:bg-black/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
            <FolderGit2 size={20} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">{categoryData.category}</h2>
          <span className="bg-white/10 text-slate-300 text-xs font-medium px-2 py-1 rounded-full">
            {filteredProjects.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-slate-400"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-2">
              <div className="space-y-3">
                {filteredProjects.map((project: any, index: number) => (
                  <motion.div 
                    key={project._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onProjectClick(project)}
                    className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 font-mono text-sm w-6 text-right">
                        {index + 1}.
                      </span>
                      <span className="text-slate-200 font-medium group-hover:text-white transition-colors">
                        {project.title}
                      </span>
                    </div>
                    <StatusBadge status={project.status} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
