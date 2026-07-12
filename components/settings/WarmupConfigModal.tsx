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
    // Simulate a brief delay for UI feel
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-[#11131A] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#232734] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#232734]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enable P2P Warmup</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">For {account.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                Daily Warmup Limit
              </label>
              <input 
                type="number"
                min="1"
                max="50"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 5)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl focus:outline-none focus:border-emerald-500/50 text-slate-900 dark:text-white text-sm font-bold transition-all" 
              />
              <p className="text-[10px] text-slate-500 mt-2">
                How many automated warmup emails this account will send/receive per day. Start low (5-10) for new domains.
              </p>
            </div>

            {account.accountType === 'smtp' && (
              <div className="pt-4 border-t border-slate-200 dark:border-[#232734]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Server size={16} className="text-indigo-500" /> IMAP Settings (Incoming)
                </h3>
                <p className="text-[10px] text-slate-500 mb-4">
                  To automatically read warmup emails and move them out of spam, we need your IMAP details. 
                  (Your SMTP password will be used for authentication).
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      IMAP Host
                    </label>
                    <input 
                      type="text"
                      placeholder="imap.hostinger.com"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl focus:outline-none focus:border-indigo-500/50 text-slate-900 dark:text-white text-sm font-bold transition-all" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        IMAP Port
                      </label>
                      <input 
                        type="number"
                        value={imapPort}
                        onChange={(e) => setImapPort(parseInt(e.target.value) || 993)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-xl focus:outline-none focus:border-indigo-500/50 text-slate-900 dark:text-white text-sm font-bold transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        Connection
                      </label>
                      <button 
                        type="button"
                        onClick={() => setImapSecure(!imapSecure)}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors text-sm font-bold ${imapSecure ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-[#09090B] border-slate-200 dark:border-[#232734] text-slate-500'}`}
                      >
                        <Shield size={16} />
                        {imapSecure ? 'SSL/TLS' : 'Unsecured'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-[#232734] bg-slate-50 dark:bg-black/20 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || (account.accountType === 'smtp' && !imapHost)}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
              Enable Warmup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
