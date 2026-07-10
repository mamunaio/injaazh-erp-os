'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getCampaignLogs } from '@/app/actions/campaignActions';

export default function CampaignLogsModal({ isOpen, campaign, onClose }: { isOpen: boolean, campaign: any, onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && campaign) {
      setLoading(true);
      getCampaignLogs(campaign._id).then(res => {
        if (res.success) {
          setLogs(res.logs);
        } else {
          alert('Failed to load logs: ' + res.error);
        }
        setLoading(false);
      });
    }
  }, [isOpen, campaign]);

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl bg-[#0f111a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Campaign Activity</h2>
            <p className="text-sm text-slate-400">Sent emails for {campaign.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-indigo-500 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
              <Mail size={32} className="mx-auto text-slate-500 mb-3 opacity-50" />
              <p className="text-slate-400 font-medium">No emails sent yet for this campaign.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, i) => (
                <div key={log._id || i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-1">
                    <Mail size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-white text-sm truncate">
                        {log.leadId?.company_name} <span className="text-slate-500 font-normal">({log.leadId?.email})</span>
                      </h4>
                      <div className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                        log.status === 'Sent' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {log.status === 'Sent' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {log.status}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mb-2">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white/70">{log.type} Sequence</span>
                      <span>•</span>
                      <span>{new Date(log.sentAt).toLocaleString()}</span>
                    </div>
                    {log.errorMessage && (
                      <p className="text-xs text-rose-400 mt-1 bg-rose-500/10 p-2 rounded-md border border-rose-500/20">
                        Error: {log.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
