'use client';

import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Calendar, MessageSquare, Paperclip, MoreVertical, Trash2, Edit, RotateCcw } from 'lucide-react';

interface KanbanCardProps {
  project: any;
  onEdit?: (project: any) => void;
  onDelete?: (projectId: string) => void;
  onResetToLead?: (project: any) => void;
}

const TECH_COLORS: Record<string, string> = {
  'Next.js': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
  'Laravel': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
  'SEO': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  'UI/UX': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20',
  'WordPress': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
  'Technical SEO': 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20',
  'Glassmorphism': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20',
  'High-end Dev': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
};

export default function KanbanCard({ project, onEdit, onDelete, onResetToLead }: KanbanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDragStarted, setIsDragStarted] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      isDragStarted ||
      (e.target as HTMLElement).closest('[data-no-click]') ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[role="button"]')
    ) {
      return;
    }
    
    if (showMenu) {
      setShowMenu(false);
      return;
    }
    
    onEdit?.(project);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragStarted(false);
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e as any);
    }
  };

  useEffect(() => {
    if (isDragging) {
      setIsDragStarted(true);
    }
  }, [isDragging]);

  const isUrgent = project.deadline && (() => {
    const deadline = new Date(project.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  })();

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays}d`;
    if (diffDays <= 14) return 'In 2w';
    if (diffDays <= 21) return 'In 3w';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={handleCardClick}
      onPointerDown={handlePointerDown}
      suppressHydrationWarning
      className="group p-4 sm:p-5 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 hover:border-[#6324FC]/50 dark:hover:border-[#6324FC]/50 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-[0_0_30px_-5px_rgba(99,36,252,0.25)] transition-all duration-300 cursor-pointer active:cursor-grabbing relative overflow-hidden flex flex-col justify-between"
    >
      <div className="relative z-10">
        {/* Tags & Options Header */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex flex-wrap gap-1.5">
            {project.techStack?.slice(0, 2).map((tech: string, idx: number) => (
              <span 
                key={idx} 
                className={`px-2 py-0.5 text-[9px] font-heading font-bold uppercase tracking-wider rounded-md border ${
                  TECH_COLORS[tech] || 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-black/10 dark:border-white/10'
                }`}
              >
                {tech}
              </span>
            ))}
            {project.tags?.includes('From Lead') && (
              <span className="px-2 py-0.5 text-[9px] font-heading font-bold uppercase tracking-wider rounded-md border bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30">
                🔗 Lead
              </span>
            )}
          </div>

          <div 
            role="button"
            tabIndex={0}
            data-no-click
            className="text-secondary hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 relative cursor-pointer shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }
            }}
          >
            <MoreVertical size={15} />
            
            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[90]" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                />
                <div className="absolute right-0 top-7 z-[100] w-44 bg-white dark:bg-[#0e0e13] border border-black/10 dark:border-white/15 rounded-xl shadow-2xl overflow-hidden py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit?.(project);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-heading font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-colors"
                  >
                    <Edit size={13} />
                    Edit Project
                  </button>
                  
                  {project.leadId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onResetToLead?.(project);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-heading font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors border-t border-black/5 dark:border-white/5"
                    >
                      <RotateCcw size={13} />
                      Reset to Lead
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-heading font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border-t border-black/5 dark:border-white/5"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(false);
            }}
          >
            <div 
              className="bg-white dark:bg-[#0a0a0d] rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-rose-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-heading font-extrabold text-slate-900 dark:text-white mb-1.5">Delete Project?</h3>
              <p className="text-xs text-secondary mb-4 leading-relaxed">
                Are you sure you want to delete "<strong>{project.title}</strong>"? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-3 py-1.5 text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                    onDelete?.(project._id);
                  }}
                  className="px-4 py-1.5 text-xs font-heading font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors line-clamp-2">
          {project.title}
        </h3>

        {/* Client Name */}
        {project.clientName && (
          <p className="text-xs text-secondary mb-3 font-medium flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6324FC] shrink-0" />
            <span className="truncate">{project.clientName}</span>
          </p>
        )}

        {/* Progress Bar */}
        {project.progress > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] font-heading font-bold mb-1">
              <span className="text-secondary">Progress</span>
              <span className="text-slate-900 dark:text-white font-mono">{project.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-[#6324FC] to-[#00E5FF] rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 pt-3 mt-2">
        {/* Deadline */}
        <div className={`flex items-center gap-1.5 text-[11px] font-heading font-bold px-2 py-1 rounded-lg transition-all ${
          isUrgent 
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' 
            : 'text-secondary bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5'
        }`}>
          {isUrgent ? <Clock size={12} className="animate-pulse text-rose-500" /> : <Calendar size={12} />}
          <span>{formatDeadline(project.deadline)}</span>
        </div>

        {/* Assignees & Meta */}
        <div className="flex items-center gap-2">
          {project.assignees && project.assignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {project.assignees.slice(0, 3).map((assignee: string, idx: number) => (
                <div
                  key={idx}
                  className="w-6 h-6 rounded-full border border-white dark:border-[#0a0a0d] bg-gradient-to-br from-[#6324FC] to-[#8B5CF6] flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                  title={assignee}
                >
                  {assignee.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
