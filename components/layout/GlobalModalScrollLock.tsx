'use client';

import { useEffect } from 'react';
import { lockScroll, unlockScroll } from '@/lib/useScrollLock';

/**
 * Global component that actively watches the DOM for any open full-screen modals,
 * dialogs, drawers, or backdrop overlays. If any modal is active, it enforces
 * complete scroll locking on both <html> and <body> and stops wheel leak to the background page.
 */
export default function GlobalModalScrollLock() {
  useEffect(() => {
    let isLockedByObserver = false;

    const MODAL_SELECTORS = [
      '[role="dialog"]',
      '[aria-modal="true"]',
      '[data-modal]',
      '.modal-overlay',
      '.modal-container',
      'div.fixed.inset-0:not(.pointer-events-none)'
    ].join(',');

    const checkActiveModals = () => {
      const candidates = document.querySelectorAll(MODAL_SELECTORS);
      let hasActiveModal = false;

      for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i] as HTMLElement;

        // Skip non-modal elements (titlebar, ambient glow, dock, widgets)
        if (
          el.id === 'electron-titlebar' ||
          el.classList.contains('pointer-events-none') ||
          el.getAttribute('aria-hidden') === 'true'
        ) {
          continue;
        }

        // Check if element is rendered and visible
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          continue;
        }

        // Check for modal backdrop signatures or explicit modal roles
        const isDialogRole = el.getAttribute('role') === 'dialog' || el.getAttribute('aria-modal') === 'true';
        const hasBackdropShade = 
          el.classList.contains('bg-black/75') ||
          el.classList.contains('bg-black/80') ||
          el.classList.contains('bg-black/70') ||
          el.classList.contains('bg-black/60') ||
          el.classList.contains('bg-black/50') ||
          el.classList.contains('bg-black/85') ||
          el.classList.contains('backdrop-blur-md') ||
          el.classList.contains('backdrop-blur-xl') ||
          el.classList.contains('backdrop-blur-2xl') ||
          el.classList.contains('backdrop-blur-sm');

        const hasModalZIndex = 
          el.classList.contains('z-50') ||
          el.classList.contains('z-[100]') ||
          el.classList.contains('z-[110]') ||
          el.classList.contains('z-[200]') ||
          el.classList.contains('z-[99999]') ||
          el.className.includes('z-');

        if (isDialogRole || (hasBackdropShade && hasModalZIndex)) {
          hasActiveModal = true;
          break;
        }
      }

      if (hasActiveModal && !isLockedByObserver) {
        isLockedByObserver = true;
        lockScroll();
      } else if (!hasActiveModal && isLockedByObserver) {
        isLockedByObserver = false;
        unlockScroll();
      }
    };

    // Run initial check
    checkActiveModals();

    // DOM Mutation observer to detect modal mount/unmount anywhere across the application
    const observer = new MutationObserver(() => {
      checkActiveModals();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-hidden', 'role']
    });

    // Intercept wheel events when a modal is open to ensure zero background scroll leak
    const handleWheel = (e: WheelEvent) => {
      if (document.documentElement.classList.contains('modal-open')) {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        // If the cursor is rolling on backdrop, headers, borders or outside scrollable content
        const scrollable = target.closest('.overflow-y-auto, .overflow-auto, textarea, select');
        if (!scrollable) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      observer.disconnect();
      window.removeEventListener('wheel', handleWheel);
      if (isLockedByObserver) {
        unlockScroll();
      }
    };
  }, []);

  return null;
}
