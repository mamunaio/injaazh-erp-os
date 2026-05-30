'use client';

import React, { useEffect, useState } from 'react';
import { Column as ColumnType, ProjectCard, ProjectStatus, Assignee } from '@/types/kanban';
import { BoardProvider, useBoardContext } from './BoardContext';
import Column from './Column';

interface KanbanBoardProps {
  initialProjects: any[];
  onCardClick?: (projectId: string) => void;
}

// Map database projects to Kanban cards
function mapProjectToCard(project: any): ProjectCard {
  return {
    id: project._id,
    title: project.title || 'Untitled Project',
    status: project.status as ProjectStatus,
    progress: project.progress || 0,
    tags: project.techStack || [],
    dueDate: project.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignees: (project.assignees || []).map((name: string): Assignee => ({
      name,
      avatarUrl: '',
    })),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export default function KanbanBoard({ initialProjects, onCardClick }: KanbanBoardProps) {
  const [initialColumns, setInitialColumns] = useState<ColumnType[]>([]);

  useEffect(() => {
    // Initialize columns with projects
    const cards = initialProjects.map(mapProjectToCard);

    const cols: ColumnType[] = [
      {
        id: 'Planning',
        title: 'Planning',
        color: 'from-blue-500 to-cyan-500',
        dotColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        cards: cards.filter((c) => c.status === 'Planning'),
      },
      {
        id: 'In Progress',
        title: 'In Progress',
        color: 'from-yellow-500 to-orange-500',
        dotColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
        cards: cards.filter((c) => c.status === 'In Progress'),
      },
      {
        id: 'In Review',
        title: 'In Review',
        color: 'from-purple-500 to-fuchsia-500',
        dotColor: 'bg-gradient-to-r from-purple-500 to-fuchsia-500',
        cards: cards.filter((c) => c.status === 'In Review'),
      },
      {
        id: 'Completed',
        title: 'Completed',
        color: 'from-green-500 to-emerald-500',
        dotColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
        cards: cards.filter((c) => c.status === 'Completed'),
      },
    ];

    setInitialColumns(cols);
  }, [initialProjects]);

  return (
    <BoardProvider initialColumns={initialColumns} onCardClick={onCardClick}>
      <BoardRenderer />
    </BoardProvider>
  );
}

function BoardRenderer() {
  const { columns } = useBoardContext();
  
  return (
    <div className="flex flex-col md:flex-row gap-5 md:overflow-x-auto pb-8 snap-y md:snap-x snap-mandatory">
      {columns.map((column) => (
        <Column key={column.id} column={column} />
      ))}
    </div>
  );
}
