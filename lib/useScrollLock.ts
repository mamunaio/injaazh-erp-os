'use client';

import { useEffect } from 'react';

// Global reference counter for stacked modals (e.g. LeadModal + ConfirmDialog)
let activeModalCount = 0;
let originalHtmlOverflow = '';
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';

export function lockScroll() {
  if (typeof window === 'undefined') return;

  if (activeModalCount === 0) {
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyOverflow = document.body.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift if scrollbar is present
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  }
  activeModalCount++;
}

export function unlockScroll() {
  if (typeof window === 'undefined') return;

  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount === 0) {
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overflow = originalBodyOverflow;
    document.body.style.paddingRight = originalBodyPaddingRight;
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }
}

/**
 * Universal hook to lock document and body scroll when a modal or dialog is open.
 * Handles reference counting so multiple open modals don't prematurely unlock the screen.
 */
export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isOpen]);
}
