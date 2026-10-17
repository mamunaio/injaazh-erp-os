import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Server, Shield, Loader2 } from 'lucide-react';

interface WarmupConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  account: any;
}

export default function WarmupConfigModal({ isOpen, onClose, onSave, account }: WarmupConfigModalProps) {
  const [limit, setLimit] = useState(5);
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [imapSecure, setImapSecure] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && account) {
      setLimit(account.warmupDailyLimit || 5);
      
      if (account.accountType === 'gmail') {
        setImapHost('imap.gmail.com');
        setImapPort(993);
        setImapSecure(true);
      } else {
        setImapHost(account.imapHost || '');
        setImapPort(account.imapPort || 993);
        setImapSecure(account.imapSecure !== false);
      }
    }
  }, [isOpen, account]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSave({
        warmupDailyLimit: limit,
        imapHost: account.accountType === 'smtp' ? imapHost : undefined,
        imapPort: account.accountType === 'smtp' ? imapPort : undefined,
        imapSecure: account.accountType === 'smtp' ? imapSecure : undefined,
      });
      setIsSaving(false);
    }, 500);
  };

  if (!isOpen || !account) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md my-auto bg-white dark:bg-[#0a0a0d] rounded-3xl shadow-2xl border border-black/10 dark:border-white/15 overflow-hidden z-10"
        >
          <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-sm">
                <Activity size={18} />
              </div>
              <div>
                <h2 className="text-base font-heading font-extrabold text-slate-900 dark:text-white">Enable P2P Warmup</h2>
                <p className="text-xs text-secondary">{account.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-secondary hover:text-rose-500 dark:hover:text-rose-400 bg-slate-100 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">
                Daily Warmup Limit
              </label>
              <input 
                type="number"
                min="1"
                max="50"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 5)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-mono font-bold transition-all placeholder:text-secondary" 
              />
              <p className="text-[10px] text-secondary mt-1.5 leading-relaxed">
                Automated warmup emails sent/received daily. Start low (5-10) for fresh domains.
              </p>
            </div>

            {account.accountType === 'smtp' && (
              <div className="pt-3 border-t border-black/5 dark:border-white/10">
                <h3 className="text-xs font-heading font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Server size={14} className="text-[#6324FC]" /> IMAP Settings (Incoming)
                </h3>
                <p className="text-[10px] text-secondary mb-3 leading-relaxed">
                  Required to auto-check warmup emails and rescue from spam folder.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">
                      IMAP Host
                    </label>
                    <input 
                      type="text"
                      placeholder="imap.hostinger.com"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs transition-all placeholder:text-secondary" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">
                        IMAP Port
                      </label>
                      <input 
                        type="number"
                        value={imapPort}
                        onChange={(e) => setImapPort(parseInt(e.target.value) || 993)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#6324FC] text-slate-900 dark:text-white text-xs font-mono transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">
                        Connection
                      </label>
                      <button 
                        type="button"
                        onClick={() => setImapSecure(!imapSecure)}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border transition-colors text-xs font-heading font-bold ${imapSecure ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-[#060608] border-black/10 dark:border-white/10 text-secondary'}`}
                      >
                        <Shield size={13} />
                        {imapSecure ? 'SSL/TLS' : 'Unsecured'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-heading font-bold text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || (account.accountType === 'smtp' && !imapHost)}
              className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl font-heading font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Activity size={13} />}
              Enable Warmup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
