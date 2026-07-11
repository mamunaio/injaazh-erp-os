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
  'LARAVEL': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'NEXT.JS': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  'WORDPRESS': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'SEO': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'UI/UX': 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  'REACT': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'NODE.JS': 'bg-green-500/10 text-green-400 border-green-500/20',
  'PYTHON': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
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
    if (!dueDate) return { text: 'No Date', isUrgent: false };
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
      className="group bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] hover:border-indigo-500/50 rounded-2xl p-4 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-sm"
    >
      {/* Tech Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {card.tags.map((tag, idx) => (
            <span
              key={idx}
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                TAG_COLORS[tag.toUpperCase()] || 'bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-700'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Project Title */}
      <h3 className="text-sm font-bold text-slate-900 dark:text-white my-3 line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors">
        {card.title}
      </h3>

      {/* Progress Section */}
      {card.progress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Progress</span>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{card.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${card.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-[#232734]">
        {/* Due Date */}
        <div className={`flex items-center gap-1.5 text-xs font-bold ${
          dueInfo.isUrgent
            ? 'text-rose-400'
            : 'text-slate-500'
        }`}>
          {dueInfo.isUrgent ? <Clock size={14} /> : <Calendar size={14} />}
          {dueInfo.text}
        </div>

        {/* Assignees */}
        {card.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {card.assignees.slice(0, 3).map((assignee, idx) => (
              <div
                key={idx}
                className="w-7 h-7 rounded-full border-2 border-[#11131A] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-slate-900 dark:text-white text-[10px] font-bold shadow-sm overflow-hidden"
                title={assignee.name}
              >
                {assignee.avatarUrl ? (
                  <Image
                    src={assignee.avatarUrl}
                    alt={assignee.name}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  assignee.name.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {card.assignees.length > 3 && (
              <div className="w-7 h-7 rounded-full border-2 border-[#11131A] bg-slate-200 dark:bg-[#232734] flex items-center justify-center text-slate-500 dark:text-slate-400 text-[10px] font-bold shadow-sm">
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
