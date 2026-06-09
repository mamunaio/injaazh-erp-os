'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, Clock, Loader2, Plus, Trash2 } from 'lucide-react';
import { updateProjectStatus, addProjectLog, toggleLogCompletion, deleteProjectLog } from '@/app/actions/roadmapActions';
import toast from 'react-hot-toast';

export interface IRoadmapProjectWithLogs {
  _id: string;
  title: string;
  category: string;
  status: string;
  logs: any[];
}

export const ProjectDrawer = ({ 
  project, 
  isOpen, 
  onClose,
  onUpdate
}: { 
  project: IRoadmapProjectWithLogs | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLogText, setNewLogText] = useState('');

  if (!project) return null;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setIsUpdatingStatus(true);
    const result = await updateProjectStatus(project._id, newStatus);
    setIsUpdatingStatus(false);
    
    if (result.success) {
      toast.success('Status updated');
      onUpdate(); // Trigger re-fetch
    } else {
      toast.error('Failed to update status');
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) return;
    
    setIsAddingLog(true);
    const result = await addProjectLog(project._id, newLogText);
    setIsAddingLog(false);
    
    if (result.success) {
      setNewLogText('');
      onUpdate();
    } else {
      toast.error('Failed to add task');
    }
  };

  const handleToggleLog = async (logId: string, currentStatus: boolean) => {
    const result = await toggleLogCompletion(project._id, logId, !currentStatus);
    if (result.success) {
      onUpdate();
    }
  };

  const handleDeleteLog = async (logId: string) => {
    const result = await deleteProjectLog(project._id, logId);
    if (result.success) {
      onUpdate();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.15)] flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-start justify-between bg-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10">
                <span className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-2 block flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  {project.category}
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">{project.title}</h2>
              </div>
              <button 
                onClick={onClose}
                className="relative z-10 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:rotate-90 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide relative">
              {/* Status Section */}
              <div className="space-y-3 relative z-10">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Status</h3>
                <div className="relative">
                  <select
                    value={project.status}
                    onChange={handleStatusChange}
                    disabled={isUpdatingStatus}
                    className="w-full appearance-none bg-black/40 border border-white/10 text-white px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-medium cursor-pointer hover:bg-black/60"
                  >
                    <option value="Planning" className="bg-[#0a0a0a]">Planning</option>
                    <option value="In Progress" className="bg-[#0a0a0a]">In Progress</option>
                    <option value="On Hold" className="bg-[#0a0a0a]">On Hold</option>
                    <option value="Completed" className="bg-[#0a0a0a]">Completed</option>
                  </select>
                  {isUpdatingStatus && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 size={18} className="animate-spin text-violet-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Task Checklist / Activity Log */}
              <div className="space-y-4 relative z-10">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <span>Task Checklist</span>
                  <span className="bg-violet-500/20 text-violet-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-violet-500/20">
                    {project.logs.filter(l => l.completed).length} / {project.logs.length}
                  </span>
                </h3>

                <form onSubmit={handleAddLog} className="relative group">
                  <input
                    type="text"
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Add a new task..."
                    className="w-full bg-black/40 border border-white/10 text-white pl-5 pr-14 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-slate-600 transition-all group-hover:border-white/20"
                  />
                  <button 
                    type="submit"
                    disabled={isAddingLog || !newLogText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600/80 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                  >
                    {isAddingLog ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  </button>
                </form>

                <div className="space-y-2.5 mt-6">
                  {project.logs.length === 0 ? (
                    <div className="text-center py-10 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                      <p className="text-slate-500 text-sm font-medium">No tasks added yet.</p>
                      <p className="text-slate-600 text-xs mt-1">Add a task above to get started</p>
                    </div>
                  ) : (
                    [...project.logs].reverse().map((log) => (
                      <motion.div 
                        key={log._id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all"
                      >
                        <button 
                          onClick={() => handleToggleLog(log._id, log.completed)}
                          className="mt-0.5 shrink-0 text-slate-500 hover:text-violet-400 transition-colors"
                        >
                          {log.completed ? (
                            <CheckCircle2 size={22} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          ) : (
                            <Circle size={22} />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium leading-relaxed ${log.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {log.text}
                          </p>
                          <span className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                            <Clock size={12} className="text-slate-600" />
                            {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteLog(log._id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
