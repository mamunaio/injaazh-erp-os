'use client';

import React from 'react';
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
  'LARAVEL': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  'NEXT.JS': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  'WORDPRESS': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'SEO': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'UI/UX': 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border-[#6324FC]/20',
  'REACT': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  'NODE.JS': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  'PYTHON': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
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
      className="group bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 rounded-2xl p-4 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(99,36,252,0.1)]"
    >
      {/* Tech Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {card.tags.map((tag, idx) => (
            <span
              key={idx}
              className={`text-[9px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                TAG_COLORS[tag.toUpperCase()] || 'bg-slate-100 dark:bg-white/5 text-secondary border-black/5 dark:border-white/5'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Project Title */}
      <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white my-2 line-clamp-2 leading-snug group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors">
        {card.title}
      </h3>

      {/* Progress Section */}
      {card.progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-heading font-bold uppercase tracking-widest text-secondary">Progress</span>
            <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">{card.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-[#060608] border border-black/5 dark:border-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] rounded-full transition-all duration-500"
              style={{ width: `${card.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/5 dark:border-white/5">
        {/* Due Date */}
        <div className={`flex items-center gap-1.5 text-xs font-mono font-semibold ${
          dueInfo.isUrgent
            ? 'text-rose-500 dark:text-rose-400'
            : 'text-secondary'
        }`}>
          {dueInfo.isUrgent ? <Clock size={13} /> : <Calendar size={13} />}
          <span>{dueInfo.text}</span>
        </div>

        {/* Assignees */}
        {card.assignees && card.assignees.length > 0 && (
          <div className="flex -space-x-2">
            {card.assignees.slice(0, 3).map((assignee, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0a0a0d] bg-gradient-to-br from-[#6324FC] to-[#00E5FF] flex items-center justify-center text-white text-[9px] font-bold shadow-xs overflow-hidden"
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
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0a0a0d] bg-slate-200 dark:bg-white/10 flex items-center justify-center text-secondary text-[9px] font-bold shadow-xs">
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
