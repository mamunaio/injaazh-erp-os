'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createTimeLog } from '@/app/actions/timesheetActions';
import toast from 'react-hot-toast';

export default function WorkTimeTracker() {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pathname = usePathname();
  const startTimeRef = useRef<number | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedActive = localStorage.getItem('timeTracker_isActive');
      const storedStartTime = localStorage.getItem('timeTracker_startTime');
      const storedTotalSeconds = localStorage.getItem('timeTracker_totalSeconds');

      if (storedActive === 'true' && storedStartTime) {
        setIsActive(true);
        const start = parseInt(storedStartTime, 10);
        startTimeRef.current = start;
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setTotalSeconds(elapsed);
      } else if (storedTotalSeconds) {
        setTotalSeconds(parseInt(storedTotalSeconds, 10));
      }
    } catch (e) {
      console.error('Error loading time tracker state', e);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('timeTracker_isActive', isActive.toString());
      if (isActive && startTimeRef.current) {
        localStorage.setItem('timeTracker_startTime', startTimeRef.current.toString());
      } else {
        localStorage.removeItem('timeTracker_startTime');
      }
      localStorage.setItem('timeTracker_totalSeconds', totalSeconds.toString());
    } catch (e) {
      console.error('Error saving time tracker state', e);
    }
  }, [isActive, totalSeconds]);

  // Timer update
  useEffect(() => {
    if (pathname === '/login' || pathname === '/' || pathname === '/register') return;

    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTotalSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, pathname]);

  if (pathname === '/login' || pathname === '/' || pathname === '/register') return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggle = async () => {
    if (isActive) {
      // Stop and Save
      setIsActive(false);
      if (totalSeconds < 60) {
        toast.error('Session too short to save (minimum 1 minute).');
        setTotalSeconds(0);
        startTimeRef.current = null;
        return;
      }

      setIsSaving(true);
      try {
        const now = new Date();
        const start = startTimeRef.current ? new Date(startTimeRef.current) : new Date(now.getTime() - totalSeconds * 1000);
        
        const startTimeStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        const res = await createTimeLog({
          project: 'General',
          task: 'Tracked Session',
          date: now.toISOString(),
          startTime: startTimeStr,
          endTime: endTimeStr,
          durationSeconds: totalSeconds
        });

        if (res.success) {
          toast.success(`Saved ${formatTime(totalSeconds)} to Timesheet!`);
        } else {
          toast.error(res.error || 'Failed to save timesheet entry.');
        }
      } catch (error) {
        toast.error('An error occurred.');
      } finally {
        setTotalSeconds(0);
        startTimeRef.current = null;
        setIsSaving(false);
        localStorage.removeItem('timeTracker_isActive');
        localStorage.removeItem('timeTracker_startTime');
        localStorage.removeItem('timeTracker_totalSeconds');
      }
    } else {
      // Start
      setIsActive(true);
      startTimeRef.current = Date.now();
      toast.success('Time tracker started!');
    }
  };

  return (
    <div className="fixed bottom-6 right-28 z-40">
      <div className="flex items-center gap-3 px-4 py-2 neu-flat rounded-2xl bg-white dark:bg-[#11131A] backdrop-blur-md border border-slate-200 dark:border-[#232734] shadow-2xl transition-all cursor-default group hover:border-[#2563EB]/30">
        
        <button 
          onClick={handleToggle}
          disabled={isSaving}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm ${
            isActive 
              ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' 
              : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
          }`}
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isActive ? (
            <Square size={14} className="fill-current" />
          ) : (
            <Play size={14} className="fill-current ml-0.5" />
          )}
        </button>

        <div className="flex flex-col min-w-[70px]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
              {isSaving ? "Saving" : isActive ? "Tracking" : "Ready"}
            </span>
          </div>
          <span className={`text-sm font-mono font-black leading-none ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
            {formatTime(totalSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
