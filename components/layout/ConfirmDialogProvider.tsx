'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, Check, X } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  variant?: 'danger' | 'info' | 'primary';
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [resolveCallback, setResolveCallback] = useState<(value: boolean) => void>(() => {});

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveCallback(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveCallback(false);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
              onClick={handleCancel}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl flex flex-col gap-6 z-10"
            >
              <div className="flex gap-4 items-start">
                <div
                  className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                    options.danger || options.variant === 'danger'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20'
                  }`}
                >
                  {options.danger || options.variant === 'danger' ? (
                    <AlertTriangle size={24} />
                  ) : (
                    <Info size={24} />
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    {options.title || 'Confirm Action'}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {options.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all active:scale-95"
                >
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 text-white active:scale-95 ${
                    options.danger || options.variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                      : 'bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 shadow-[#6324FC]/25'
                  }`}
                >
                  <Check size={18} />
                  {options.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmDialogContext.Provider>
  );
};
