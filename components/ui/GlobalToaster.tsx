'use client';

import React, { useEffect } from 'react';
import toast, { Toaster, ToastBar, useToasterStore } from 'react-hot-toast';

export const MAX_VISIBLE_TOASTS = 3;

/**
 * Controller to enforce a maximum of 3 simultaneously visible toasts.
 * In react-hot-toast, new toasts are prepended to the `toasts` array.
 * Thus, indices 0, 1, 2 represent the 3 most recent toasts.
 * Any visible toast at index >= 3 is automatically dismissed.
 */
function ToastLimitController({ max = MAX_VISIBLE_TOASTS }: { max?: number }) {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .slice(max)
      .forEach((t) => {
        toast.dismiss(t.id);
      });
  }, [toasts, max]);

  return null;
}

/**
 * GlobalToaster Component
 *
 * Single application-level Toaster mounted at the root layout.
 * Features:
 * 1. Enforces max 3 visible toasts globally.
 * 2. Provides keyboard-accessible dismiss button on every toast.
 * 3. Positioned at top-right, safely below the 60px header and clearing mobile safe zones.
 * 4. Preserves dark mode luxury theme matching Injaazh ERP design language.
 */
export default function GlobalToaster() {
  return (
    <>
      <ToastLimitController max={MAX_VISIBLE_TOASTS} />
      <Toaster
        position="top-right"
        containerStyle={{
          top: 68,
          right: 16,
          bottom: 16,
          left: 16,
          pointerEvents: 'none',
        }}
        toastOptions={{
          duration: 4000,
          style: {
            pointerEvents: 'auto',
            background: '#0d0f17',
            color: '#f1f5f9',
            border: '1px solid rgba(99, 36, 252, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 20px 45px -10px rgba(0,0,0,0.7), 0 0 20px rgba(99,36,252,0.15)',
            maxWidth: '420px',
            wordBreak: 'break-word',
          },
          success: {
            duration: 3500,
            iconTheme: { primary: '#10B981', secondary: '#07080b' },
          },
          error: {
            duration: 5000,
            iconTheme: { primary: '#F43F5E', secondary: '#07080b' },
          },
          loading: {
            duration: Infinity,
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="flex items-center gap-2.5 w-full">
                {icon && <div className="shrink-0">{icon}</div>}
                <div className="flex-1 text-xs sm:text-sm font-medium leading-snug break-words">
                  {message}
                </div>
                {t.type !== 'loading' && (
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    className="shrink-0 p-1 -mr-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6324FC]"
                    aria-label="Dismiss notification"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
    </>
  );
}
