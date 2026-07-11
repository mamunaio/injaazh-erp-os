'use client';

import React, { useState } from 'react';
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
  'Next.js': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
  'Laravel': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
  'SEO': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20',
  'UI/UX': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20',
  'WordPress': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  'Technical SEO': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  'Glassmorphism': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20',
  'High-end Dev': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
};

export default function KanbanCard({ project, onEdit, onDelete, onResetToLead }: KanbanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDragStarted, setIsDragStarted] = useState(false);
  const [clickStartTime, setClickStartTime] = useState(0);
  
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

  // Handle card click - open edit modal only if not dragging
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if:
    // 1. Currently dragging
    // 2. Clicking on menu, buttons, or interactive elements
    if (
      isDragStarted ||
      (e.target as HTMLElement).closest('[data-no-click]') ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[role="button"]')
    ) {
      return;
    }
    
    // If menu is open, just close it, don't open edit modal
    if (showMenu) {
      setShowMenu(false);
      return;
    }
    
    onEdit?.(project);
  };

  // Track drag start with timestamp
  const handlePointerDown = (e: React.PointerEvent) => {
    setClickStartTime(Date.now());
    setIsDragStarted(false);
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e as any);
    }
  };

  // Track if actually dragging
  React.useEffect(() => {
    if (isDragging) {
      setIsDragStarted(true);
    }
  }, [isDragging]);

  // Calculate if deadline is urgent
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
    if (diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays <= 14) return 'In 2 weeks';
    if (diffDays <= 21) return 'In 3 weeks';
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
      className="group p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-purple-200/40 dark:border-purple-500/30 rounded-2xl shadow-lg hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.4)] hover:border-purple-400/60 dark:hover:border-purple-400/50 transition-all duration-300 cursor-pointer active:cursor-grabbing relative overflow-hidden"
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">{/* Tags & Options */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-2">
          {project.techStack?.slice(0, 3).map((tech: string, idx: number) => (
            <span 
              key={idx} 
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border-2 shadow-sm ${
                TECH_COLORS[tech] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              {tech}
            </span>
          ))}
          {project.tags?.includes('From Lead') && (
            <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border-2 bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20 shadow-sm">
              🔗 Lead
            </span>
          )}
        </div>
        <div 
          role="button"
          tabIndex={0}
          data-no-click
          className="text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 relative cursor-pointer"
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
          <MoreVertical size={16} />
          
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
                  // Prevent card click from triggering
                  e.stopPropagation();
                }}
              />
              <div className="absolute right-0 top-8 z-[100] w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit?.(project);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit size={14} />
                  Edit
                </button>
                
                {/* Reset to Lead - Only show if project is linked to a lead */}
                {project.leadId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onResetToLead?.(project);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors border-t border-slate-200 dark:border-slate-700"
                  >
                    <RotateCcw size={14} />
                    Reset to Lead
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-slate-200 dark:border-slate-700"
                >
                  <Trash2 size={14} />
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/50 dark:bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-200 dark:border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Delete Project?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete "<strong>{project.title}</strong>"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                  onDelete?.(project._id);
                }}
                className="px-4 py-2 text-sm font-bold text-slate-900 dark:text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all shadow-lg hover:shadow-red-500/30"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-2">
        {project.title}
      </h3>

      {/* Client Name */}
      {project.clientName && (
        <p className="text-sm text-slate-600 dark:text-gray-400 mb-4 font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          {project.clientName}
        </p>
      )}

      {/* Progress Bar */}
      {project.progress > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-600 dark:text-gray-400 font-semibold">Progress</span>
            <span className="text-slate-800 dark:text-gray-200 font-bold">{project.progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full relative transition-all duration-500 shadow-lg"
              style={{ width: `${project.progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Footer Metrics */}
      <div className="flex items-center justify-between mt-auto border-t-2 border-slate-100 dark:border-white/5 pt-4">
        {/* Deadline */}
        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
          isUrgent 
            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-2 border-red-200 dark:border-red-500/30 shadow-md shadow-red-200/50 dark:shadow-red-500/20' 
            : 'text-slate-600 dark:text-gray-400 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700'
        }`}>
          {isUrgent ? <Clock size={14} className="animate-pulse" /> : <Calendar size={14} />}
          {formatDeadline(project.deadline)}
        </div>

        {/* Avatars & Meta */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 dark:text-gray-500 text-xs">
            {project.comments > 0 && (
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                <MessageSquare size={12} /> {project.comments}
              </span>
            )}
            {project.attachments > 0 && (
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                <Paperclip size={12} /> {project.attachments}
              </span>
            )}
          </div>
          
          {project.assignees && project.assignees.length > 0 && (
            <div className="flex -space-x-2">
              {project.assignees.slice(0, 3).map((assignee: string, idx: number) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-slate-900 dark:text-white text-xs font-bold shadow-md hover:scale-110 transition-transform"
                  title={assignee}
                >
                  {assignee.charAt(0).toUpperCase()}
                </div>
              ))}
              {project.assignees.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold shadow-md">
                  +{project.assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      
      {/* Accent line on hover - animated */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
      </div>
    </div>
  );
}
