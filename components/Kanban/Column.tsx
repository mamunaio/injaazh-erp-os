'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Column as ColumnType, ProjectStatus } from '@/types/kanban';
import Card from './Card';
import EmptyState from './EmptyState';
import { useBoardContext } from './BoardContext';

interface ColumnProps {
  column: ColumnType;
}

export default function Column({ column }: ColumnProps) {
  const { addProject, onCardClick } = useBoardContext();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-full md:w-80 flex-shrink-0 flex flex-col bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-[24px] shadow-sm ${
        isOver ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#09090B]' : ''
      } overflow-hidden transition-all duration-300`}
    >
      {/* Column Header */}
      <div className="p-5 border-b border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Status Dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`}
            />
            {/* Title */}
            <h2 className="font-bold text-sm tracking-wide text-slate-900 dark:text-white uppercase">
              {column.title}
            </h2>
            {/* Count Pill */}
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-lg bg-slate-200 dark:bg-[#232734] text-slate-700 dark:text-slate-300 text-[11px] font-bold">
              {column.cards.length}
            </span>
          </div>
          {/* Add Button */}
          <button
            onClick={() => addProject(column.id)}
            className="text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20"
            title="Add new project"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Column Body - Droppable Area */}
      <div className="p-4 flex-1 overflow-y-auto min-h-[200px]">
        <SortableContext
          items={column.cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.length === 0 ? (
            <EmptyState status={column.id} />
          ) : (
            <div className="flex flex-col gap-3">
              {column.cards.map((card) => (
                <Card 
                  key={card.id} 
                  card={card}
                  onClick={onCardClick ? () => onCardClick(card.id) : undefined}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
