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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleCancel}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md neu-flat rounded-3xl p-6 sm:p-8 flex flex-col gap-6"
            >
              <div className="flex gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center ${options.danger ? 'text-rose-500' : 'text-indigo-500'}`}>
                  {options.danger ? <AlertTriangle size={24} /> : <Info size={24} />}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                    {options.title || 'Confirm Action'}
                  </h3>
                  <p className="text-[15px] font-inter text-slate-500 dark:text-slate-400 leading-relaxed">
                    {options.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 neu-button text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold rounded-xl transition-all"
                >
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-5 py-2.5 neu-button font-bold rounded-xl transition-all flex items-center gap-2 ${
                    options.danger 
                      ? 'text-rose-500 hover:text-rose-600' 
                      : 'text-indigo-500 hover:text-indigo-600'
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
