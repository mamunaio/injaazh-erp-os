'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, MessageSquare, Clock, ArrowRight } from 'lucide-react';

interface AIInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadsToFollowUp: any[];
  repliesWaiting: any[];
  inactiveLeads: any[];
  onActionClick: (lead: any) => void;
}

export default function AIInsightModal({ isOpen, onClose, leadsToFollowUp, repliesWaiting, inactiveLeads, onActionClick }: AIInsightModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm z-[99]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-6 border-b border-slate-200 dark:border-[#232734] flex justify-between items-center bg-slate-50 dark:bg-[#09090B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Sparkles size={20} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Morning Insights</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Actionable tasks based on your pipeline</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-[#232734] text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Follow Ups */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500" /> 
                  Action Required: Follow-ups Today ({leadsToFollowUp.length})
                </h3>
                {leadsToFollowUp.length > 0 ? (
                  <div className="space-y-2">
                    {leadsToFollowUp.map(lead => (
                      <div key={lead._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734]">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{lead.company_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{lead.contact_person || 'Unknown'}</p>
                        </div>
                        <button 
                          onClick={() => { onClose(); onActionClick(lead); }}
                          className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                        >
                          View <ArrowRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#09090B] p-3 rounded-xl border border-slate-200 dark:border-[#232734]">No leads need follow up today.</p>
                )}
              </div>

              {/* Replies Waiting */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-500" /> 
                  Good News: Replies Waiting ({repliesWaiting.length})
                </h3>
                {repliesWaiting.length > 0 ? (
                  <div className="space-y-2">
                    {repliesWaiting.map(lead => (
                      <div key={lead._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734]">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{lead.company_name}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">Status: {lead.outreach_status}</p>
                        </div>
                        <button 
                          onClick={() => { onClose(); onActionClick(lead); }}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                        >
                          View <ArrowRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#09090B] p-3 rounded-xl border border-slate-200 dark:border-[#232734]">No new replies right now.</p>
                )}
              </div>

              {/* Inactive Leads */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-slate-500" /> 
                  Warning: Inactive Leads ({inactiveLeads.length})
                </h3>
                {inactiveLeads.length > 0 ? (
                  <div className="space-y-2">
                    {inactiveLeads.slice(0, 5).map(lead => (
                      <div key={lead._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734]">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{lead.company_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Last updated: {new Date(lead.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <button 
                          onClick={() => { onClose(); onActionClick(lead); }}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-[#232734] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-[#323847] transition-colors flex items-center gap-1"
                        >
                          View <ArrowRight size={14} />
                        </button>
                      </div>
                    ))}
                    {inactiveLeads.length > 5 && (
                      <p className="text-xs text-slate-500 text-center mt-2">...and {inactiveLeads.length - 5} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#09090B] p-3 rounded-xl border border-slate-200 dark:border-[#232734]">No inactive leads detected.</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
