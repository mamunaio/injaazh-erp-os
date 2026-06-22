'use client';

import React, { useEffect, useState, useRef } from 'react';
import { pingWorkSession, getTodayWorkSession } from '@/app/actions/workSessionActions';
import { Clock } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function WorkTimeTracker() {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const pathname = usePathname();
  const initialized = useRef(false);

  // Initialize and get the current total seconds
  useEffect(() => {
    if (pathname === '/login' || pathname === '/') return;
    
    if (!initialized.current) {
      initialized.current = true;
      getTodayWorkSession().then((res) => {
        if (res.success) {
          setTotalSeconds(res.totalSeconds);
        }
      });
    }
  }, [pathname]);

  // Ping server every 60 seconds
  useEffect(() => {
    if (pathname === '/login' || pathname === '/') return;

    const ping = async () => {
      // Only ping if window is focused
      if (document.visibilityState === 'visible') {
        const res = await pingWorkSession();
        if (res.success && res.totalSeconds !== undefined) {
          setTotalSeconds(res.totalSeconds);
          setIsActive(true);
        }
      } else {
        setIsActive(false);
      }
    };

    // Ping immediately on mount
    ping();

    // Ping every 60 seconds
    const interval = setInterval(ping, 60000);
    
    // Also ping when window gets focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  // Local timer update for smooth UI
  useEffect(() => {
    if (pathname === '/login' || pathname === '/') return;

    let interval: NodeJS.Timeout;
    if (isActive && document.visibilityState === 'visible') {
      interval = setInterval(() => {
        setTotalSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, pathname]);

  if (pathname === '/login' || pathname === '/') return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="flex items-center gap-3 px-4 py-2 neu-flat rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/5 shadow-lg group hover:border-indigo-500/30 transition-all cursor-default">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-400'}`}></div>
        <Clock size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Today's Work</span>
          <span className="text-sm font-mono font-black text-slate-700 dark:text-slate-200 leading-none">{formatTime(totalSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
