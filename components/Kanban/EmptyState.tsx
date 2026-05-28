'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { ProjectStatus } from '@/types/kanban';
import { useBoardContext } from './BoardContext';

interface EmptyStateProps {
  status: ProjectStatus;
}

export default function EmptyState({ status }: EmptyStateProps) {
  const { addProject } = useBoardContext();

  return (
    <div
      onClick={() => addProject(status)}
      className="min-h-[150px] w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 group"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-500/20 dark:to-violet-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
        <Plus size={24} className="text-purple-600 dark:text-purple-400" />
      </div>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No projects</p>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Drag here to add</p>
    </div>
  );
}
