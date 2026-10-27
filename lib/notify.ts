import toast, { ToastOptions } from 'react-hot-toast';
import { sounds } from './sound';

export interface InstantNotificationPayload {
  id?: string;
  type?: 'payment' | 'lead' | 'system' | 'proposal';
  message: string;
  link?: string;
  sound?: 'income' | 'edit' | 'notification' | 'delete' | 'expense' | 'success';
}

/**
 * Audio rate limiter: Prevents jarring auditory overlap when multiple events fire within 300ms.
 */
let lastAudioTimestamp = 0;
const AUDIO_COOLDOWN_MS = 300;

function safePlaySound(soundFn?: () => void) {
  if (!soundFn) return;
  const now = Date.now();
  if (now - lastAudioTimestamp >= AUDIO_COOLDOWN_MS) {
    lastAudioTimestamp = now;
    try {
      soundFn();
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }
}

/**
 * Deterministic Event Deduplication Registry.
 * Tracks emitted notification IDs, event keys, and normalized messages with expiration TTL.
 */
const emittedEvents = new Map<string, number>();

export const normalizeMsg = (msg: string) => (msg || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function pruneExpiredEvents() {
  const now = Date.now();
  for (const [key, expiresAt] of emittedEvents.entries()) {
    if (now > expiresAt) {
      emittedEvents.delete(key);
    }
  }
}

export const notify = {
  // ── Standard Alert Interface ──
  success: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.success);
    return toast.success(message, options);
  },

  error: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.error);
    return toast.error(message, options);
  },

  info: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.notification);
    return toast(message, {
      icon: 'ℹ️',
      duration: 4000,
      ...options,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    // Loading toasts do not play audio to avoid noisy UX during routine async calls
    return toast.loading(message, options);
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading: msgs.loading,
        success: (data) => {
          safePlaySound(sounds.success);
          return typeof msgs.success === 'function' ? msgs.success(data) : msgs.success;
        },
        error: (err) => {
          safePlaySound(sounds.error);
          return typeof msgs.error === 'function' ? msgs.error(err) : msgs.error;
        },
      },
      options
    );
  },

  // ── Notification Center Alert ──
  notification: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.notification);
    return toast(message, {
      icon: '🔔',
      duration: 4000,
      style: {
        background: '#0d0f17',
        color: '#f8fafc',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        boxShadow: '0 20px 45px -10px rgba(0,0,0,0.7), 0 0 25px rgba(0,229,255,0.25)',
      },
      ...options,
    });
  },

  // ── Semantic Sound Shortcuts ──
  income: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.income);
    return toast.success(message, options);
  },

  expense: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.expense);
    return toast.success(message, options);
  },

  delete: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.delete);
    return toast.success(message, options);
  },

  mailSend: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.mailSend);
    return toast.success(message, options);
  },

  edit: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.edit);
    return toast.success(message, options);
  },

  login: (message: string, options?: ToastOptions) => {
    safePlaySound(sounds.login);
    return toast.success(message, options);
  },

  // ── Instant Zero-Latency Optimistic Notification ──
  instant: (payload: InstantNotificationPayload) => {
    const soundType = payload.sound || (payload.type === 'payment' ? 'income' : payload.type === 'lead' ? 'edit' : 'notification');
    
    // 1. Play sound with audio rate limiter
    if (soundType === 'income') safePlaySound(sounds.income);
    else if (soundType === 'expense') safePlaySound(sounds.expense);
    else if (soundType === 'delete') safePlaySound(sounds.delete);
    else if (soundType === 'edit') safePlaySound(sounds.edit);
    else if (soundType === 'success') safePlaySound(sounds.success);
    else safePlaySound(sounds.notification);

    // 2. Deterministic deduplication registration (both ID and normalized message)
    if (payload.id) {
      notify.markEmitted(payload.id, 30000);
    }
    const msgKey = normalizeMsg(payload.message);
    notify.markEmitted(msgKey, 30000);

    // 3. Render toast immediately
    const toastId = toast(payload.message, {
      id: payload.id,
      icon: payload.type === 'payment' ? '💰' : payload.type === 'lead' ? '🎯' : payload.sound === 'expense' ? '💸' : '🔔',
      duration: 4000,
      style: {
        background: '#0d0f17',
        color: '#f8fafc',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        boxShadow: '0 20px 45px -10px rgba(0,0,0,0.7), 0 0 25px rgba(0,229,255,0.25)',
      }
    });

    // 4. Dispatch instant event to Topbar so bell count & dropdown update at T = 0ms
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('instant-notification', { detail: payload }));
    }

    return toastId;
  },

  // ── Deduplication Helpers ──
  markEmitted: (keyOrId: string, ttlMs: number = 30000) => {
    if (!keyOrId) return;
    pruneExpiredEvents();
    emittedEvents.set(keyOrId, Date.now() + ttlMs);
  },

  isRecentlyEmitted: (keyOrMessage: string): boolean => {
    if (!keyOrMessage) return false;
    pruneExpiredEvents();
    if (emittedEvents.has(keyOrMessage)) return true;
    const normalized = normalizeMsg(keyOrMessage);
    return emittedEvents.has(normalized);
  },

  clearEmitted: (keyOrId: string) => {
    emittedEvents.delete(keyOrId);
    emittedEvents.delete(normalizeMsg(keyOrId));
  },

  triggerRefresh: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fetch-notifications'));
    }
  }
};
