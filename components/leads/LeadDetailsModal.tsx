'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, MessageCircle, Mail, Globe, Phone, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeadDetailsModal({ 
  isOpen, 
  onClose, 
  lead, 
  onUpdateLead 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  lead: any; 
  onUpdateLead: (id: string, updateData: any) => Promise<void> 
}) {
  const [formData, setFormData] = useState<any>({});
  const [newLog, setNewLog] = useState({ type: 'Note', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        company_name: lead.company_name || '',
        contact_person: lead.contact_person || '',
        email: lead.email || '',
        phone: lead.phone || '',
        outreach_status: lead.outreach_status || 'New',
        targetService: lead.targetService || 'High-end Web Development',
        nextFollowUpDate: lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().split('T')[0] : '',
        outreach_logs: lead.outreach_logs || []
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onUpdateLead(lead._id, formData);
    setIsSubmitting(false);
    onClose();
  };

  const handleAddLog = async () => {
    if (!newLog.note.trim()) return;
    setIsSubmitting(true);
    
    const updatedLogs = [
      { method: newLog.type, notes: newLog.note, date: new Date().toISOString() },
      ...(formData.outreach_logs || [])
    ];
    
    const updatePayload = {
      ...formData,
      outreach_logs: updatedLogs
    };
    
    await onUpdateLead(lead._id, updatePayload);
    
    setFormData(updatePayload);
    setNewLog({ type: 'Note', note: '' });
    setIsSubmitting(false);
  };

  const getLogIcon = (method: string) => {
    switch (method) {
      case 'Email': return <Mail size={14} className="text-blue-400" />;
      case 'WhatsApp': return <MessageCircle size={14} className="text-green-400" />;
      case 'Phone': return <Phone size={14} className="text-purple-400" />;
      case 'Facebook': return <Globe size={14} className="text-indigo-400" />;
      default: return <FileText size={14} className="text-gray-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl h-[85vh] bg-white/80 dark:bg-purple-950/20 backdrop-blur-2xl border border-slate-200 dark:border-purple-500/10 shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.7)] rounded-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-purple-500/10 bg-white/50 dark:bg-black/20">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{lead.company_name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Lead Details & Activity Tracking</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column: Lead Info */}
            <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-200 dark:border-purple-500/10 bg-white/50 dark:bg-transparent">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-6">Lead Information</h3>
              
              <form id="lead-details-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Company Name</label>
                    <input 
                      type="text" 
                      value={formData.company_name || ''}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Contact Person</label>
                    <input 
                      type="text" 
                      value={formData.contact_person || ''}
                      onChange={e => setFormData({...formData, contact_person: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Status</label>
                    <select 
                      value={formData.outreach_status || 'New'}
                      onChange={e => setFormData({...formData, outreach_status: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {['New', 'Contacted', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Target Service</label>
                    <select 
                      value={formData.targetService || 'High-end Web Development'}
                      onChange={e => setFormData({...formData, targetService: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {['High-end Web Development', 'Next.js / Laravel App', 'WordPress Development', 'Custom ERP / SaaS', 'Technical SEO', 'Answer Engine Optimization (AEO)', 'Generative Engine Optimization (GEO)', 'UI/UX Design'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Email</label>
                    <input 
                      type="email" 
                      value={formData.email || ''}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase">Phone</label>
                    <input 
                      type="tel" 
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5 uppercase flex items-center gap-2">
                    <Calendar size={14} /> Next Follow-up Date
                  </label>
                  <input 
                    type="date" 
                    value={formData.nextFollowUpDate || ''}
                    onChange={e => setFormData({...formData, nextFollowUpDate: e.target.value})}
                    className="w-full bg-slate-50 border-slate-300 text-slate-800 focus:bg-white dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>

              </form>
            </div>

            {/* Right Column: Activity Timeline */}
            <div className="w-1/2 flex flex-col bg-white/20 dark:bg-black/20">
              <div className="p-6 border-b border-slate-200 dark:border-purple-500/10">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-4">Log Activity</h3>
                <div className="flex flex-col gap-3">
                  <textarea 
                    value={newLog.note}
                    onChange={e => setNewLog({...newLog, note: e.target.value})}
                    placeholder="Write a note about your outreach..."
                    className="w-full bg-white border-slate-300 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[80px] resize-none"
                  />
                  <div className="flex gap-3">
                    <select 
                      value={newLog.type}
                      onChange={e => setNewLog({...newLog, type: e.target.value})}
                      className="flex-1 bg-white border-slate-300 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700/50 border rounded-xl px-4 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {['Note', 'Email', 'WhatsApp', 'Facebook', 'Phone'].map(opt => (
                        <option key={opt} value={opt} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">{opt}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={handleAddLog}
                      disabled={isSubmitting || !newLog.note.trim()}
                      className="px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-50"
                    >
                      Add Log
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-6">Timeline</h3>
                
                <div className="relative border-l border-slate-200 dark:border-white/10 ml-3 space-y-6 pb-6">
                  {(!formData.outreach_logs || formData.outreach_logs.length === 0) ? (
                    <p className="ml-6 text-sm text-slate-500 italic">No activity logged yet.</p>
                  ) : (
                    formData.outreach_logs.map((log: any, idx: number) => (
                      <div key={idx} className="relative ml-6 group">
                        <span className="absolute -left-8 top-1 flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 group-hover:border-indigo-400 transition-colors">
                          {getLogIcon(log.method)}
                        </span>
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-4 backdrop-blur-sm shadow-sm dark:shadow-none group-hover:bg-slate-50 dark:group-hover:bg-white/10 group-hover:border-slate-300 dark:group-hover:border-white/10 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">{log.method}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(log.date).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{log.notes}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-purple-500/10 bg-white/50 dark:bg-black/40 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              form="lead-details-form"
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
