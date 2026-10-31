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
  const [isIdlePaused, setIsIdlePaused] = useState(false);
  const [activeProject, setActiveProject] = useState<string>('General');
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedActive = localStorage.getItem('timeTracker_isActive');
      const storedIdle = localStorage.getItem('timeTracker_isIdlePaused');
      const storedStartTime = localStorage.getItem('timeTracker_startTime');
      const storedTotalSeconds = localStorage.getItem('timeTracker_totalSeconds');
      const storedProject = localStorage.getItem('timeTracker_project');

      if (storedProject) setActiveProject(storedProject);

      if (storedIdle === 'true') {
        setIsIdlePaused(true);
        setIsActive(false);
        if (storedTotalSeconds) setTotalSeconds(parseInt(storedTotalSeconds, 10) || 0);
      } else if (storedActive === 'true') {
        setIsActive(true);
        if (storedStartTime) {
          startTimeRef.current = parseInt(storedStartTime, 10) || Date.now();
        }
        if (storedTotalSeconds) {
          setTotalSeconds(parseInt(storedTotalSeconds, 10) || 0);
        }
      } else if (storedTotalSeconds) {
        setTotalSeconds(parseInt(storedTotalSeconds, 10) || 0);
      }
    } catch (e) {
      console.error('Error loading time tracker state', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Event listener for project-specific time tracking
  useEffect(() => {
    const handleStartProjectTimer = (e: any) => {
      const projName = e.detail?.projectName || 'General';
      setActiveProject(projName);
      setIsActive(true);
      setIsIdlePaused(false);
      startTimeRef.current = Date.now();
      localStorage.setItem('timeTracker_project', projName);
      toast.success(`Tracking billable time for: ${projName}`);
    };

    window.addEventListener('start-project-timer' as any, handleStartProjectTimer);
    return () => window.removeEventListener('start-project-timer' as any, handleStartProjectTimer);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('timeTracker_isActive', isActive.toString());
      localStorage.setItem('timeTracker_isIdlePaused', isIdlePaused.toString());
      if (isActive && startTimeRef.current) {
        localStorage.setItem('timeTracker_startTime', startTimeRef.current.toString());
      } else {
        localStorage.removeItem('timeTracker_startTime');
      }
      localStorage.setItem('timeTracker_totalSeconds', totalSeconds.toString());
    } catch (e) {
      console.error('Error saving time tracker state', e);
    }
  }, [isActive, isIdlePaused, totalSeconds, isLoaded]);

  // Idle Detection & Timer Update
  useEffect(() => {
    if (pathname === '/login' || pathname === '/' || pathname === '/register') return;

    let interval: NodeJS.Timeout;
    
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (isIdlePaused) {
        setIsIdlePaused(false);
        setIsActive(true);
        startTimeRef.current = Date.now();
        toast('Welcome back! Timer resumed automatically.', { icon: '⏱️' });
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    if (isActive) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now - lastActivityRef.current > IDLE_TIMEOUT) {
          setIsActive(false);
          setIsIdlePaused(true);
          toast('Timer paused due to 5 mins of inactivity.', { icon: '💤' });
          return;
        }

        setTotalSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [isActive, isIdlePaused, pathname]);

  if (pathname === '/login' || pathname === '/' || pathname === '/register' || !isLoaded) {
    return null;
  }

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggle = async () => {
    if (isActive || isIdlePaused) {
      // Stop and Save
      if (totalSeconds < 60) {
        setIsActive(false);
        setIsIdlePaused(false);
        setTotalSeconds(0);
        startTimeRef.current = null;
        localStorage.removeItem('timeTracker_startTime');
        localStorage.removeItem('timeTracker_totalSeconds');
        toast('Session under 1 minute was not saved.', { icon: 'ℹ️' });
        return;
      }

      setIsSaving(true);
      const hours = Number((totalSeconds / 3600).toFixed(2));
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const start = new Date(now.getTime() - totalSeconds * 1000);

      try {
        const res = await createTimeLog({
          project: activeProject || 'General',
          task: `Auto-tracked (${formatTime(totalSeconds)})`,
          date: today,
          startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          durationSeconds: totalSeconds,
        });

        if (res.success) {
          toast.success(`Saved ${hours} hrs to Timesheets!`);
          setIsActive(false);
          setIsIdlePaused(false);
          setTotalSeconds(0);
          startTimeRef.current = null;
          localStorage.removeItem('timeTracker_startTime');
          localStorage.removeItem('timeTracker_totalSeconds');
        } else {
          toast.error(res.error || 'Failed to auto-save time log');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error recording timesheet log');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Start
      setIsActive(true);
      startTimeRef.current = Date.now();
      toast.success('Time tracker started!');
    }
  };

  if (!isLoaded) return null;

  // Do not show time tracker on auth pages or public proposal pages
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname?.startsWith('/reset-password') ||
    pathname === '/proposal' ||
    pathname?.startsWith('/proposal/') ||
    (pathname?.startsWith('/requirements/') && !pathname?.startsWith('/requirements/create') && !pathname?.includes('/edit')) ||
    pathname?.startsWith('/requirement/') ||
    (pathname?.startsWith('/seo/') && !pathname?.startsWith('/seo/create') && !pathname?.includes('/manage') && !pathname?.includes('/edit'))
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-24 z-40 print:hidden">
      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-lg transition-all cursor-default group hover:border-[#6324FC]/50">
        
        <button 
          onClick={handleToggle}
          disabled={isSaving}
          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-xs ${
            (isActive || isIdlePaused) 
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white' 
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white'
          }`}
        >
          {isSaving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (isActive || isIdlePaused) ? (
            <Square size={12} className="fill-current" />
          ) : (
            <Play size={12} className="fill-current ml-0.5" />
          )}
        </button>

        <div className="flex flex-col min-w-[65px] max-w-[130px]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]' : isIdlePaused ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
            <span className="text-[9px] font-heading font-bold text-secondary uppercase tracking-widest leading-none truncate">
              {isSaving ? "Saving" : isActive ? (activeProject !== 'General' ? activeProject : "Tracking") : isIdlePaused ? "Paused" : "Ready"}
            </span>
          </div>
          <span className={`text-xs font-mono font-bold leading-none ${isActive ? 'text-emerald-600 dark:text-emerald-400' : isIdlePaused ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
            {formatTime(totalSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
