'use client';

import React from 'react';
import TeamTasksView from '@/components/leadGen/TeamTasksView';
import { useLeadGen } from '../LeadGenContext';

export default function TeamTasksSubPage() {
  const { data, handleAddTask, handleUpdateTask } = useLeadGen();

  if (!data) return null;

  return (
    <TeamTasksView
      tasks={data.teamTasks}
      onAddTask={handleAddTask}
      onUpdateTask={handleUpdateTask}
    />
  );
}
