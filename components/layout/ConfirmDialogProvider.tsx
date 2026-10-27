'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, Check, Loader2 } from 'lucide-react';
import { useScrollLock } from '@/lib/useScrollLock';

export interface ConfirmOptions {
  title?: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  variant?: 'danger' | 'info' | 'primary';
  allowCancel?: boolean;
  initialFocus?: 'cancel' | 'confirm';
  onConfirm?: () => Promise<void> | void;
}

export interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
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
  useScrollLock(isOpen);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const resolveCallbackRef = useRef<((value: boolean) => void) | null>(null);
  const isResolvedRef = useRef(false);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const closeAndResolve = useCallback((result: boolean) => {
    if (isResolvedRef.current) return;
    isResolvedRef.current = true;

    setIsOpen(false);
    setIsProcessing(false);

    const resolve = resolveCallbackRef.current;
    resolveCallbackRef.current = null;
    if (resolve) {
      resolve(result);
    }

    // Restore focus to original triggering element
    if (triggerElementRef.current && typeof document !== 'undefined') {
      const el = triggerElementRef.current;
      triggerElementRef.current = null;
      setTimeout(() => {
        if (document.body.contains(el)) {
          try {
            el.focus();
          } catch {
            // Ignore if element is not focusable or detached
          }
        }
      }, 16);
    }
  }, []);

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    // Capture the trigger element before opening
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      triggerElementRef.current = document.activeElement;
    } else {
      triggerElementRef.current = null;
    }

    // If an earlier confirmation is still pending, safely resolve it as false (cancelled)
    if (resolveCallbackRef.current && !isResolvedRef.current) {
      resolveCallbackRef.current(false);
    }

    const normalizedOptions: ConfirmOptions = typeof opts === 'string' ? { message: opts } : opts;
    setOptions(normalizedOptions);
    setIsProcessing(false);
    isResolvedRef.current = false;
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolveCallbackRef.current = resolve;
    });
  }, []);

  const handleConfirm = async () => {
    if (isProcessing || isResolvedRef.current) return;

    if (options.onConfirm) {
      setIsProcessing(true);
      try {
        await options.onConfirm();
        closeAndResolve(true);
      } catch (err) {
        // Leave dialog open and interactive on async failure so user can recover
        setIsProcessing(false);
        throw err;
      }
    } else {
      closeAndResolve(true);
    }
  };

  const handleCancel = useCallback(() => {
    if (isProcessing || isResolvedRef.current) return;
    if (options.allowCancel === false) return;
    closeAndResolve(false);
  }, [isProcessing, options.allowCancel, closeAndResolve]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleCancel();
  };

  // Keyboard navigation: Escape key & Tab focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Escape key cancellation
      if (e.key === 'Escape') {
        if (options.allowCancel !== false && !isProcessing) {
          e.preventDefault();
          e.stopPropagation();
          handleCancel();
        }
        return;
      }

      // 2. Focus Trap on Tab / Shift+Tab
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, options.allowCancel, isProcessing, handleCancel]);

  // Initial focus management
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (options.initialFocus === 'confirm' && confirmButtonRef.current) {
        confirmButtonRef.current.focus();
      } else if (cancelButtonRef.current) {
        cancelButtonRef.current.focus();
      } else if (confirmButtonRef.current) {
        confirmButtonRef.current.focus();
      } else if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }, 30);

    return () => clearTimeout(timer);
  }, [isOpen, options.initialFocus]);

  const isDanger = Boolean(options.danger || options.variant === 'danger');

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 overscroll-contain overflow-y-auto"
          >
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
              onClick={handleBackdropClick}
              aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              role={isDanger ? 'alertdialog' : 'dialog'}
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-description"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md my-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c0d14] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl flex flex-col gap-6 z-10 overscroll-contain max-h-[calc(100vh-2rem)] overflow-y-auto focus:outline-none"
            >
              <div className="flex gap-4 items-start">
                <div
                  className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isDanger
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/20'
                  }`}
                  aria-hidden="true"
                >
                  {isDanger ? (
                    <AlertTriangle size={24} />
                  ) : (
                    <Info size={24} />
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <h3
                    id="confirm-dialog-title"
                    className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2"
                  >
                    {options.title || (isDanger ? 'Confirm Deletion' : 'Confirm Action')}
                  </h3>
                  <p
                    id="confirm-dialog-description"
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed"
                  >
                    {options.description || options.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/10">
                <button
                  ref={cancelButtonRef}
                  type="button"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-slate-600 dark:focus:ring-offset-[#0c0d14]"
                >
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  aria-busy={isProcessing ? 'true' : undefined}
                  className={`px-5 py-2.5 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#0c0d14] ${
                    isDanger
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 focus:ring-rose-500'
                      : 'bg-gradient-to-r from-[#6324FC] to-[#4F46E5] hover:opacity-95 shadow-[#6324FC]/25 focus:ring-[#6324FC]'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  {options.confirmText || (isDanger ? 'Delete' : 'Confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmDialogContext.Provider>
  );
};
