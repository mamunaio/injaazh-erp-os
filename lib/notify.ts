import toast from 'react-hot-toast';
import { sounds } from './sound';

export interface InstantNotificationPayload {
  type?: 'payment' | 'lead' | 'system' | 'proposal';
  message: string;
  link?: string;
  sound?: 'income' | 'edit' | 'notification' | 'delete' | 'expense' | 'success';
}

// Track locally emitted messages so background DB polling doesn't replay sounds
const recentEmittedMessages = new Set<string>();
const normalizeMsg = (msg: string) => (msg || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const notify = {
  success: (message: string) => {
    sounds.edit();
    toast.success(message);
  },
  error: (message: string) => {
    sounds.error();
    toast.error(message);
  },
  notification: (message: string) => {
    sounds.notification();
    toast(message, {
      icon: '🔔',
      duration: 4000,
      style: {
        background: '#0d0f17',
        color: '#f8fafc',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        boxShadow: '0 20px 45px -10px rgba(0,0,0,0.7), 0 0 25px rgba(0,229,255,0.25)',
      }
    });
  },
  income: (message: string) => {
    sounds.income();
    toast.success(message);
  },
  expense: (message: string) => {
    sounds.expense();
    toast.success(message);
  },
  delete: (message: string) => {
    sounds.delete();
    toast.success(message);
  },
  mailSend: (message: string) => {
    sounds.mailSend();
    toast.success(message);
  },
  edit: (message: string) => {
    sounds.edit();
    toast.success(message);
  },
  login: (message: string) => {
    sounds.login();
    toast.success(message);
  },

  // 🚀 INSTANT ZERO-LATENCY NOTIFICATION (Plays at T = 0ms, updates Topbar at T = 0ms)
  instant: (payload: InstantNotificationPayload) => {
    const soundType = payload.sound || (payload.type === 'payment' ? 'income' : payload.type === 'lead' ? 'edit' : 'notification');
    
    // 1. Play sound immediately with zero delay
    if (soundType === 'income') sounds.income();
    else if (soundType === 'expense') sounds.expense();
    else if (soundType === 'delete') sounds.delete();
    else if (soundType === 'edit') sounds.edit();
    else if (soundType === 'success') sounds.success();
    else sounds.notification();

    // 2. Track message to suppress duplicate alert on subsequent DB poll
    const key = normalizeMsg(payload.message);
    recentEmittedMessages.add(key);
    setTimeout(() => recentEmittedMessages.delete(key), 30000);

    // 3. Render toast immediately
    toast(payload.message, {
      icon: payload.type === 'payment' ? '💰' : payload.type === 'lead' ? '🎯' : payload.sound === 'expense' ? '💸' : '🔔',
      duration: 4000,
      style: {
        background: '#0d0f17',
        color: '#f8fafc',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        boxShadow: '0 20px 45px -10px rgba(0,0,0,0.7), 0 0 25px rgba(0,229,255,0.25)',
      }
    });

    // 4. Dispatch instant event to Topbar so bell icon & dropdown update at T = 0ms
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('instant-notification', { detail: payload }));
    }
  },

  isRecentlyEmitted: (message: string) => {
    return recentEmittedMessages.has(normalizeMsg(message));
  },

  triggerRefresh: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fetch-notifications'));
    }
  }
};
