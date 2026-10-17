'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Column as ColumnType } from '@/types/kanban';
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
      className={`w-full md:w-80 flex-shrink-0 flex flex-col bg-slate-50/70 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-3xl shadow-sm ${
        isOver ? 'ring-2 ring-[#6324FC] ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#060608]' : ''
      } overflow-hidden transition-all duration-200`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#0a0a0d]">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            {/* Status Dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`}
            />
            {/* Title */}
            <h2 className="font-heading font-extrabold text-xs tracking-wider text-slate-900 dark:text-white uppercase">
              {column.title}
            </h2>
            {/* Count Pill */}
            <span className="flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-secondary text-[10px] font-mono font-bold border border-black/5 dark:border-white/5">
              {column.cards.length}
            </span>
          </div>
          {/* Add Button */}
          <button
            onClick={() => addProject(column.id)}
            className="text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-colors p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
            title="Add new project"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Column Body - Droppable Area */}
      <div className="p-3.5 flex-1 overflow-y-auto min-h-[200px] custom-scrollbar">
        <SortableContext
          items={column.cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.length === 0 ? (
            <EmptyState status={column.id} />
          ) : (
            <div className="flex flex-col gap-2.5">
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
