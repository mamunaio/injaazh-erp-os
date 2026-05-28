'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ProjectCard, ProjectStatus, Column } from '@/types/kanban';
import { updateProjectStatus } from '@/app/actions/projectActions';

interface BoardContextType {
  columns: Column[];
  activeCard: ProjectCard | null;
  addProject: (status: ProjectStatus) => void;
  updateCard: (cardId: string, updates: Partial<ProjectCard>) => void;
  onCardClick?: (cardId: string) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const useBoardContext = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within BoardProvider');
  }
  return context;
};

interface BoardProviderProps {
  children: React.ReactNode;
  initialColumns: Column[];
  onCardClick?: (cardId: string) => void;
}

export function BoardProvider({ children, initialColumns, onCardClick }: BoardProviderProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeCard, setActiveCard] = useState<ProjectCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findCardAndColumn = useCallback((cardId: string) => {
    for (const column of columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) {
        return { card, column };
      }
    }
    return null;
  }, [columns]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const result = findCardAndColumn(active.id as string);
    if (result) {
      setActiveCard(result.card);
    }
  }, [findCardAndColumn]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dragging over a column
    if (overId === 'Planning' || overId === 'In Progress' || overId === 'In Review' || overId === 'Completed') {
      const result = findCardAndColumn(activeId);
      if (!result) return;

      const { card, column: sourceColumn } = result;
      const targetStatus = overId as ProjectStatus;

      if (sourceColumn.id !== targetStatus) {
        // Optimistic update
        setColumns((prev) => {
          const newColumns = prev.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => c.id !== activeId),
          }));

          const targetColumn = newColumns.find((col) => col.id === targetStatus);
          if (targetColumn) {
            targetColumn.cards.push({ ...card, status: targetStatus });
          }

          return newColumns;
        });
      }
    }
  }, [findCardAndColumn]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target status
    let targetStatus: ProjectStatus | null = null;

    if (overId === 'Planning' || overId === 'In Progress' || overId === 'In Review' || overId === 'Completed') {
      targetStatus = overId as ProjectStatus;
    } else {
      // Dropped on another card, find its column
      const result = findCardAndColumn(overId);
      if (result) {
        targetStatus = result.column.id;
      }
    }

    if (!targetStatus) return;

    const activeResult = findCardAndColumn(activeId);
    if (!activeResult) return;

    const { card } = activeResult;

    if (card.status !== targetStatus) {
      // Update server
      try {
        await updateProjectStatus(activeId, targetStatus);
        console.log(`✅ Updated ${card.title} to ${targetStatus}`);
      } catch (error) {
        console.error('Failed to update project status:', error);
        // Revert optimistic update on error
        setColumns(initialColumns);
      }
    }
  }, [findCardAndColumn, initialColumns]);

  const addProject = useCallback((status: ProjectStatus) => {
    const newCard: ProjectCard = {
      id: `temp-${Date.now()}`,
      title: 'Untitled Project',
      status,
      progress: 0,
      tags: [],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignees: [],
      createdAt: new Date().toISOString(),
    };

    setColumns((prev) =>
      prev.map((col) =>
        col.id === status
          ? { ...col, cards: [newCard, ...col.cards] }
          : col
      )
    );
  }, []);

  const updateCard = useCallback((cardId: string, updates: Partial<ProjectCard>) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        ),
      }))
    );
  }, []);

  return (
    <BoardContext.Provider value={{ columns, activeCard, addProject, updateCard, onCardClick }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {activeCard ? (
            <div className="rotate-3 scale-105 opacity-90">
              {/* Card preview will be rendered here */}
              <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-purple-500/10 shadow-2xl rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {activeCard.title}
                </h3>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </BoardContext.Provider>
  );
}
