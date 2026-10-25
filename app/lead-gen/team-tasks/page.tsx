'use client';

import React from 'react';
import TeamTasksView from '@/components/leadGen/TeamTasksView';
import { useLeadGen } from '../LeadGenContext';
import { Loader2 } from 'lucide-react';

export default function TeamTasksSubPage() {
  const { data, handleAddTask, handleUpdateTask, handleDeleteTask } = useLeadGen();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
      </div>
    );
  }

  return (
    <TeamTasksView
      tasks={data.teamTasks || []}
      onAddTask={handleAddTask}
      onUpdateTask={handleUpdateTask}
      onDeleteTask={handleDeleteTask}
    />
  );
}
