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
  
  // Idle tracking refs
  const lastActivityRef = useRef(Date.now());
  const isIdleRef = useRef(false);

  // 1. Initialize and get the current total seconds
  useEffect(() => {
    if (pathname === '/login' || pathname === '/' || pathname === '/register') return;
    
    if (!initialized.current) {
      initialized.current = true;
      getTodayWorkSession().then((res) => {
        if (res.success && res.totalSeconds !== undefined) {
          setTotalSeconds(res.totalSeconds);
        }
      });
    }
  }, [pathname]);

  // 2. Activity listeners with throttling
  useEffect(() => {
    if (pathname === '/login' || pathname === '/' || pathname === '/register') return;

    let throttleTimer: NodeJS.Timeout | null = null;
    const updateActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => { throttleTimer = null; }, 1500);

      lastActivityRef.current = Date.now();

      if (isIdleRef.current) {
        // Resume from idle
        isIdleRef.current = false;
        setIsActive(true);
        // Immediately ping to set lastActiveTime on backend so we start counting from now
        pingWorkSession().then(res => {
          if (res.success && res.totalSeconds !== undefined) {
            setTotalSeconds(res.totalSeconds);
          }
        });
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));
    
    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [pathname]);

  // 3. Local timer update & Idle Check (runs every second)
  useEffect(() => {
    if (pathname === '/login' || pathname === '/' || pathname === '/register') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const isVisible = document.visibilityState === 'visible';

      // 10 minutes = 600,000 ms
      if (timeSinceLastActivity >= 600000 && !isIdleRef.current) {
        // Just became idle!
        isIdleRef.current = true;
        setIsActive(false);
        setTotalSeconds(prev => Math.max(0, prev - 600)); // retroactive deduction visually immediately
        
        // Inform backend to deduct 600 seconds retroactively
        pingWorkSession(600).then(res => {
           if (res.success && res.totalSeconds !== undefined) {
             setTotalSeconds(res.totalSeconds);
           }
        });
      }

      if (!isIdleRef.current && isVisible) {
        setTotalSeconds(prev => prev + 1);
        if (!isActive) setIsActive(true);
      } else if (!isVisible && isActive) {
        setIsActive(false); // Pause visually if window is hidden
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, pathname]);

  // 4. Ping server every 60 seconds
  useEffect(() => {
    if (pathname === '/login' || pathname === '/' || pathname === '/register') return;

    const ping = async () => {
      if (isIdleRef.current || document.visibilityState !== 'visible') return;
      
      const res = await pingWorkSession();
      if (res.success && res.totalSeconds !== undefined) {
        setTotalSeconds(res.totalSeconds);
      }
    };

    const interval = setInterval(ping, 60000);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isIdleRef.current) {
        ping();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  if (pathname === '/login' || pathname === '/' || pathname === '/register') return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-28 z-40">
      <div className="flex items-center gap-3 px-4 py-2 neu-flat rounded-2xl bg-[#11131A] backdrop-blur-md border border-[#232734] shadow-2xl group hover:border-violet-500/30 transition-all cursor-default">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500'}`}></div>
        <Clock size={16} className="text-slate-400 group-hover:text-violet-500 transition-colors" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
            {isActive ? "Working" : "Idle"}
          </span>
          <span className="text-sm font-mono font-black text-slate-200 leading-none">{formatTime(totalSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
