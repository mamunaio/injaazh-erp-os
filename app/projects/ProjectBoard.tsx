'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import KanbanCard from '@/components/KanbanCard';
import { updateProjectStatus, deleteProject } from '@/app/actions/projectActions';
import { updateLeadStatus } from '@/app/actions/leadActions';
import { useRouter } from 'next/navigation';

const COLUMNS = [
  { id: 'Planning', title: 'Planning', color: 'from-blue-500 to-cyan-500' },
  { id: 'In Progress', title: 'In Progress', color: 'from-yellow-500 to-orange-500' },
  { id: 'In Review', title: 'In Review', color: 'from-purple-500 to-pink-500' },
  { id: 'Completed', title: 'Completed', color: 'from-green-500 to-emerald-500' },
];

interface DroppableColumnProps {
  column: typeof COLUMNS[0];
  projects: any[];
  isDragging: boolean;
  onEdit: (project: any) => void;
  onDelete: (projectId: string) => void;
  onResetToLead: (project: any) => void;
}

function DroppableColumn({ column, projects, isDragging, onEdit, onDelete, onResetToLead }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="w-full min-w-[340px] max-w-[380px] flex-shrink-0 flex flex-col snap-center rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-2 border-purple-200/40 dark:border-purple-500/20 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      {/* Column Header */}
      <div className="p-5 border-b-2 border-purple-200/40 dark:border-purple-500/20 bg-gradient-to-br from-white/80 to-purple-50/50 dark:from-black/30 dark:to-purple-950/30">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${column.color} shadow-lg`} />
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">
              {column.title}
            </h2>
            <span className="flex items-center justify-center min-w-[28px] h-7 px-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-md">
              {projects.length}
            </span>
          </div>
          <button className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Droppable Column Body */}
      <SortableContext
        id={column.id}
        items={projects.map((p) => p._id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`p-5 flex-1 overflow-y-auto min-h-[200px] transition-all duration-300 ${
            isDragging ? 'bg-purple-100/50 dark:bg-purple-500/10 border-2 border-dashed border-purple-400 dark:border-purple-500' : ''
          }`}
        >
          <div className="flex flex-col gap-5">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-gray-600">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-500/10 dark:to-pink-500/10 flex items-center justify-center mb-4 shadow-lg">
                  <Plus size={32} className="text-purple-400 dark:text-purple-500" />
                </div>
                <p className="text-sm font-semibold">No projects</p>
                <p className="text-xs mt-1">Drag here to add</p>
              </div>
            ) : (
              projects.map((project) => (
                <KanbanCard 
                  key={project._id} 
                  project={project}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onResetToLead={onResetToLead}
                />
              ))
            )}
          </div>
        </div>
      </SortableContext>
    </div>
  );
}

interface ProjectBoardProps {
  initialProjects: any[];
  onEdit: (project: any) => void;
}

export default function ProjectBoard({ initialProjects, onEdit }: ProjectBoardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local state with server data after refresh
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  // Group projects by status
  const projectsByStatus = useMemo(() => {
    const grouped: Record<string, any[]> = {
      'Planning': [],
      'In Progress': [],
      'In Review': [],
      'Completed': [],
    };

    projects.forEach((project) => {
      if (grouped[project.status]) {
        grouped[project.status].push(project);
      }
    });

    return grouped;
  }, [projects]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = projects.find((p) => p._id === active.id);
    setActiveProject(project);
    setIsDragging(true);
  };

  const handleDelete = async (projectId: string) => {
    // Optimistic update - remove from UI immediately
    setProjects((prev) => prev.filter((p) => p._id !== projectId));

    try {
      const result = await deleteProject(projectId);
      if (!result.success) {
        console.error('Failed to delete project:', result.error);
        // Revert on error - add back to UI
        const deletedProject = projects.find((p) => p._id === projectId);
        if (deletedProject) {
          setProjects((prev) => [...prev, deletedProject]);
        }
        alert('Failed to delete project: ' + (result.error || 'Unknown error'));
      } else {
        console.log('🗑️ Project deleted successfully');
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      // Revert on error
      const deletedProject = projects.find((p) => p._id === projectId);
      if (deletedProject) {
        setProjects((prev) => [...prev, deletedProject]);
      }
      alert('Failed to delete project');
    }
  };

  const handleResetToLead = async (project: any) => {
    if (!project.leadId) {
      alert('This project is not linked to a lead');
      return;
    }

    const confirmed = confirm(
      `Reset "${project.title}" back to Lead?\n\n` +
      `This will:\n` +
      `• Delete this project\n` +
      `• Change the lead status back to "Contacted"\n` +
      `• Allow you to close the lead again for testing\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    // Optimistic update - remove from UI
    setProjects((prev) => prev.filter((p) => p._id !== project._id));

    try {
      // Delete the project
      const deleteResult = await deleteProject(project._id);
      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Failed to delete project');
      }

      // Reset lead status to "Contacted"
      const leadResult = await updateLeadStatus(project.leadId, 'Contacted');
      if (!leadResult.success) {
        console.error('Failed to reset lead status:', leadResult.error);
        // Project is already deleted, so just show warning
        alert('Project deleted but failed to reset lead status. Please check the lead manually.');
      } else {
        console.log('✅ Project reset to lead successfully');
      }

      router.refresh();
    } catch (error: any) {
      console.error('Error resetting to lead:', error);
      // Revert on error
      setProjects((prev) => [...prev, project]);
      alert('Failed to reset to lead: ' + error.message);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    setActiveProject(null);

    if (!over) return;

    const projectId = active.id as string;
    
    // Determine the new status from the drop target
    // The drop target could be either a column or another card
    let newStatus: string;
    
    // Check if dropped on a column (over.id will be column name)
    if (COLUMNS.some(col => col.id === over.id)) {
      newStatus = over.id as string;
    } else {
      // Dropped on another card, find which column that card belongs to
      const targetProject = projects.find((p) => p._id === over.id);
      if (!targetProject) return;
      newStatus = targetProject.status;
    }

    // Find the project being dragged
    const project = projects.find((p) => p._id === projectId);
    if (!project || project.status === newStatus) return;

    console.log(`Moving project "${project.title}" from "${project.status}" to "${newStatus}"`);

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) =>
        p._id === projectId ? { ...p, status: newStatus } : p
      )
    );

    // Server update
    try {
      const result = await updateProjectStatus(projectId, newStatus);
      if (!result.success) {
        console.error('Failed to update project status:', result.error);
        // Revert on error
        setProjects((prev) =>
          prev.map((p) =>
            p._id === projectId ? { ...p, status: project.status } : p
          )
        );
        alert('Failed to update project status: ' + (result.error || 'Unknown error'));
      } else {
        console.log('✅ Project status updated successfully');
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      // Revert on error
      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId ? { ...p, status: project.status } : p
        )
      );
      alert('Failed to update project status');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
        {COLUMNS.map((column) => {
          const columnProjects = projectsByStatus[column.id] || [];
          return (
            <DroppableColumn
              key={column.id}
              column={column}
              projects={columnProjects}
              isDragging={isDragging}
              onEdit={onEdit}
              onDelete={handleDelete}
              onResetToLead={handleResetToLead}
            />
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeProject ? (
          <div className="rotate-6 scale-110 opacity-90">
            <KanbanCard project={activeProject} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
