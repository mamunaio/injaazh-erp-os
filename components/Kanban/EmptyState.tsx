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
      className="min-h-[140px] w-full rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group bg-black/[0.01] dark:bg-white/[0.01] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
    >
      <div className="w-9 h-9 rounded-xl bg-[#6324FC]/10 dark:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#00E5FF] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
        <Plus size={16} />
      </div>
      <p className="text-xs font-heading font-bold text-slate-700 dark:text-slate-300">No projects</p>
      <p className="text-[10px] text-secondary mt-0.5">Click or drag here</p>
    </div>
  );
}
