'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock } from 'lucide-react';
import { ProjectCard } from '@/types/kanban';
import Image from 'next/image';

interface CardProps {
  card: ProjectCard;
  onClick?: () => void;
}

const TAG_COLORS: Record<string, string> = {
  'LARAVEL': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
  'NEXT.JS': 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20',
  'WORDPRESS': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  'SEO': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20',
  'UI/UX': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20',
  'REACT': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
  'NODE.JS': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  'PYTHON': 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/20',
};

export default function Card({ card, onClick }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
    zIndex: isDragging ? 50 : 1,
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', isUrgent: true };
    if (diffDays === 0) return { text: 'Today', isUrgent: true };
    if (diffDays === 1) return { text: 'Tomorrow', isUrgent: true };
    if (diffDays <= 7) return { text: `In ${diffDays} days`, isUrgent: diffDays <= 2 };
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isUrgent: false };
  };

  const dueInfo = formatDueDate(card.dueDate);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not dragging
    if (onClick && !isDragging) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      suppressHydrationWarning
      className="group bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-purple-500/10 dark:border-purple-500/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-purple-400/40 dark:hover:border-purple-500/40 rounded-xl p-4 transition-all duration-300 cursor-pointer"
    >
      {/* Tech Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {card.tags.map((tag, idx) => (
            <span
              key={idx}
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                TAG_COLORS[tag.toUpperCase()] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Project Title */}
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 my-3 line-clamp-2">
        {card.title}
      </h3>

      {/* Progress Section */}
      {card.progress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Progress</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{card.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${card.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Due Date */}
        <div className={`flex items-center gap-1.5 text-xs font-medium ${
          dueInfo.isUrgent
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-600 dark:text-slate-400'
        }`}>
          {dueInfo.isUrgent ? <Clock size={12} /> : <Calendar size={12} />}
          {dueInfo.text}
        </div>

        {/* Assignees */}
        {card.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {card.assignees.slice(0, 3).map((assignee, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-950 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-[10px] font-bold shadow-sm overflow-hidden"
                title={assignee.name}
              >
                {assignee.avatarUrl ? (
                  <Image
                    src={assignee.avatarUrl}
                    alt={assignee.name}
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  assignee.name.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {card.assignees.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] font-bold shadow-sm">
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
