'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Plus, Calendar, DollarSign, Activity, Edit3, Trash2, Search, X, 
  Loader2, ChevronLeft, ChevronRight, Filter, Download, Sparkles, TrendingUp,
  Flame, CheckCircle2, RotateCcw, Check, ArrowUpRight, Tag, HelpCircle,
  Play, Pause, Square, Zap, Sliders, Briefcase, RefreshCw, AlertCircle
} from 'lucide-react';
import { createTimeLog, deleteTimeLog, updateTimeLog, updateTimeLogRate, getTimesheetKPIs, saveProjectHourlyRate, saveUserDefaultRate } from '@/app/actions/timesheetActions';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useConfirm } from '@/components/layout/ConfirmDialogProvider';
import { useScrollLock } from '@/lib/useScrollLock';

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface TimeLogItem {
  _id: string;
  project: string;
  task: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  hourlyRate?: number;
  billable?: boolean;
  createdAt?: string | Date;
}

export interface ProjectRateItem {
  name: string;
  rate: number;
  status?: string;
}

interface TimesheetsClientProps {
  user: any;
  initialLogs: TimeLogItem[];
  initialKpis: any;
  initialProjectRates?: {
    projects: ProjectRateItem[];
    rates: Record<string, number>;
    defaultRate?: number;
  };
}

// ─── DropdownPortal Component (Zero Clipping) ─────────────────────────────────
interface DropdownPortalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  minWidth?: number;
  className?: string;
}

function DropdownPortal({
  isOpen,
  onClose,
  triggerRef,
  children,
  minWidth = 180,
  className = '',
}: DropdownPortalProps) {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    placement: 'top' | 'bottom';
  }>({
    left: 0,
    width: minWidth,
    placement: 'bottom',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 240;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: 'top' | 'bottom' = 'bottom';
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      placement = 'top';
    }

    const targetWidth = Math.max(minWidth, rect.width);
    let left = rect.left;
    if (left + targetWidth > viewportWidth - 12) {
      left = rect.right - targetWidth;
    }
    left = Math.max(12, Math.min(left, viewportWidth - targetWidth - 12));

    if (placement === 'top') {
      setCoords({
        bottom: viewportHeight - rect.top + 6,
        left,
        width: targetWidth,
        placement: 'top',
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        width: targetWidth,
        placement: 'bottom',
      });
    }
  }, [minWidth, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, updatePosition, triggerRef]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: coords.top !== undefined ? `${coords.top}px` : 'auto',
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        zIndex: 999999,
      }}
      className={`animate-in fade-in-0 zoom-in-95 duration-150 ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}

// ─── PortalSelect Component ───────────────────────────────────────────────────
interface PortalSelectOption {
  value: string;
  label: string;
}

interface PortalSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: PortalSelectOption[];
  labelPrefix?: string;
  minWidth?: number;
  className?: string;
  size?: 'sm' | 'md';
}

function PortalSelect({
  value,
  onChange,
  options,
  labelPrefix,
  minWidth = 160,
  className = '',
  size = 'md',
}: PortalSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOpt = options.find((o) => o.value === value) || options[0];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#060608] hover:border-[#6324FC]/60 dark:hover:border-white/25 transition-all outline-none select-none ${
          size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-xs'
        } ${className}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {labelPrefix && <span className="text-secondary font-normal shrink-0">{labelPrefix}:</span>}
          <span className="font-heading font-semibold text-slate-900 dark:text-white truncate">
            {selectedOpt?.label || value}
          </span>
        </div>
        <ChevronRight
          size={13}
          className={`text-secondary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90 text-[#6324FC] dark:text-[#00E5FF]' : ''}`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        minWidth={minWidth}
        className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0c0d14] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        {labelPrefix && (
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-secondary border-b border-black/5 dark:border-white/5 mb-1">
            Select {labelPrefix}
          </div>
        )}
        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-heading font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-[#6324FC]/10 dark:bg-[#00E5FF]/10 text-[#6324FC] dark:text-[#00E5FF] font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check size={13} className="shrink-0 text-[#6324FC] dark:text-[#00E5FF]" />
                )}
              </button>
            );
          })}
        </div>
      </DropdownPortal>
    </>
  );
}

// ─── Main Timesheets Client ───────────────────────────────────────────────────
export default function TimesheetsClient({ user, initialLogs, initialKpis, initialProjectRates }: TimesheetsClientProps) {
  const [logs, setLogs] = useState<TimeLogItem[]>(initialLogs || []);
  const [kpis, setKpis] = useState<any>(initialKpis || { 
    today: 0, 
    week: 0, 
    month: 0, 
    billableValue: 0, 
    averageRate: 25, 
    uniqueProjectsCount: 0, 
    chartData: [] 
  });
  const { confirm } = useConfirm();

  // Project Rates Master Map & Projects List
  const [projectRates, setProjectRates] = useState<Record<string, number>>(
    initialProjectRates?.rates || {}
  );
  const [projectsList, setProjectsList] = useState<ProjectRateItem[]>(
    initialProjectRates?.projects || []
  );
  const [isProjectRatesModalOpen, setIsProjectRatesModalOpen] = useState(false);
  const [searchProjectRateQuery, setSearchProjectRateQuery] = useState('');
  const [newProjectRateName, setNewProjectRateName] = useState('');
  const [newProjectRateVal, setNewProjectRateVal] = useState('35');
  const [isSavingProjectRate, setIsSavingProjectRate] = useState(false);

  // Persistent user default hourly rate (server synced + localStorage fallback)
  const [defaultRate, setDefaultRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('injaazh_default_hourly_rate');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    }
    if (typeof initialProjectRates?.defaultRate === 'number' && initialProjectRates.defaultRate >= 0) {
      return initialProjectRates.defaultRate;
    }
    return 25;
  });

  const [isEditingDefaultRate, setIsEditingDefaultRate] = useState(false);
  const [tempDefaultRateInput, setTempDefaultRateInput] = useState(defaultRate.toString());

  const handleSaveDefaultRate = async () => {
    const parsed = parseFloat(tempDefaultRateInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setDefaultRate(parsed);
      if (typeof window !== 'undefined') {
        localStorage.setItem('injaazh_default_hourly_rate', parsed.toString());
      }
      toast.success(`Default rate set to $${parsed}/hr`);
      setIsEditingDefaultRate(false);
      // Persist to database SystemSettings and refresh server KPIs
      await saveUserDefaultRate(parsed);
      refreshKpis();
    } else {
      toast.error('Invalid hourly rate');
      setIsEditingDefaultRate(false);
    }
  };

  // ─── Live Project Stopwatch State ───────────────────────────────────────────
  const [timerProject, setTimerProject] = useState<string>('');
  const [timerTask, setTimerTask] = useState<string>('');
  const [timerRate, setTimerRate] = useState<number>(defaultRate);
  const [timerBillable, setTimerBillable] = useState<boolean>(true);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [timerElapsedSeconds, setTimerElapsedSeconds] = useState<number>(0);

  // Restore active timer from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('injaazh_timesheet_active_timer');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.isTimerRunning) {
          setTimerProject(data.project || '');
          setTimerTask(data.task || '');
          setTimerRate(typeof data.rate === 'number' ? data.rate : defaultRate);
          setTimerBillable(data.billable !== false);
          setIsTimerRunning(true);
          setIsTimerPaused(!!data.isTimerPaused);
          setTimerStartTime(data.startTime);
          
          if (data.isTimerPaused) {
            setTimerElapsedSeconds(data.elapsedSeconds || 0);
          } else {
            const now = Date.now();
            const diffSec = Math.floor((now - (data.lastTimestamp || now)) / 1000);
            setTimerElapsedSeconds((data.elapsedSeconds || 0) + Math.max(0, diffSec));
          }
        }
      }
    } catch (e) {
      console.error('Failed to load active timer', e);
    }
  }, [defaultRate]);

  // Live Timer 1-second Interval & localStorage persistence
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isTimerPaused) {
      interval = setInterval(() => {
        setTimerElapsedSeconds(prev => {
          const next = prev + 1;
          try {
            localStorage.setItem('injaazh_timesheet_active_timer', JSON.stringify({
              isTimerRunning: true,
              isTimerPaused: false,
              startTime: timerStartTime,
              lastTimestamp: Date.now(),
              elapsedSeconds: next,
              project: timerProject,
              task: timerTask,
              rate: timerRate,
              billable: timerBillable,
            }));
          } catch (e) {}
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isTimerPaused, timerStartTime, timerProject, timerTask, timerRate, timerBillable]);

  const formatStopwatch = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timerLiveEarnings = useMemo(() => {
    if (!timerBillable) return 0;
    return (timerElapsedSeconds / 3600) * (timerRate || defaultRate);
  }, [timerBillable, timerElapsedSeconds, timerRate, defaultRate]);

  const handleSelectTimerProject = (projName: string) => {
    setTimerProject(projName);
    const preSetRate = projectRates[projName] !== undefined 
      ? projectRates[projName] 
      : defaultRate;
    setTimerRate(preSetRate);
  };

  const handleStartTimer = () => {
    if (!timerProject.trim()) {
      toast.error('Please select or type a project name');
      return;
    }
    const now = Date.now();
    const effectiveRate = projectRates[timerProject] !== undefined ? projectRates[timerProject] : timerRate || defaultRate;
    setTimerRate(effectiveRate);
    setIsTimerRunning(true);
    setIsTimerPaused(false);
    setTimerStartTime(now);
    setTimerElapsedSeconds(0);

    localStorage.setItem('injaazh_timesheet_active_timer', JSON.stringify({
      isTimerRunning: true,
      isTimerPaused: false,
      startTime: now,
      lastTimestamp: now,
      elapsedSeconds: 0,
      project: timerProject,
      task: timerTask,
      rate: effectiveRate,
      billable: timerBillable,
    }));
    toast.success(`Timer started for "${timerProject}" ($${effectiveRate}/hr)`);
  };

  const handlePauseResumeTimer = () => {
    if (isTimerPaused) {
      setIsTimerPaused(false);
      localStorage.setItem('injaazh_timesheet_active_timer', JSON.stringify({
        isTimerRunning: true,
        isTimerPaused: false,
        startTime: timerStartTime,
        lastTimestamp: Date.now(),
        elapsedSeconds: timerElapsedSeconds,
        project: timerProject,
        task: timerTask,
        rate: timerRate,
        billable: timerBillable,
      }));
    } else {
      setIsTimerPaused(true);
      localStorage.setItem('injaazh_timesheet_active_timer', JSON.stringify({
        isTimerRunning: true,
        isTimerPaused: true,
        startTime: timerStartTime,
        lastTimestamp: Date.now(),
        elapsedSeconds: timerElapsedSeconds,
        project: timerProject,
        task: timerTask,
        rate: timerRate,
        billable: timerBillable,
      }));
    }
  };

  const handleStopAndSaveTimer = async () => {
    if (timerElapsedSeconds < 10) {
      toast.error('Tracked duration is too short to log (minimum 10 seconds)');
      return;
    }

    const durationSeconds = Math.max(60, timerElapsedSeconds);
    const startDate = timerStartTime ? new Date(timerStartTime) : new Date(Date.now() - timerElapsedSeconds * 1000);
    const endDate = new Date();
    
    const startTimeStr = format(startDate, 'HH:mm');
    const endTimeStr = format(endDate, 'HH:mm');
    const dateStr = format(startDate, 'yyyy-MM-dd');
    const effectiveRate = timerRate || projectRates[timerProject] || defaultRate;

    const payload = {
      project: timerProject.trim(),
      task: timerTask.trim() || 'Live tracked execution',
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationSeconds,
      hourlyRate: effectiveRate,
      billable: timerBillable,
    };

    const res = await createTimeLog(payload);
    if (res.success && res.data) {
      const earned = timerBillable ? ((durationSeconds / 3600) * effectiveRate).toFixed(2) : '0.00';
      toast.success(`Logged ${formatTimeSeconds(durationSeconds)} on ${timerProject} ($${earned})!`);
      setLogs([res.data, ...logs]);
      refreshKpis();

      setIsTimerRunning(false);
      setIsTimerPaused(false);
      setTimerElapsedSeconds(0);
      setTimerStartTime(null);
      setTimerTask('');
      localStorage.removeItem('injaazh_timesheet_active_timer');
    } else {
      toast.error(res.error || 'Failed to save tracked time');
    }
  };

  const handleDiscardTimer = async () => {
    const isConfirmed = await confirm({
      title: 'Discard Live Timer Session?',
      message: 'Are you sure you want to discard this recorded work session? All tracked time will be lost.',
      confirmText: 'Yes, Discard',
      cancelText: 'Keep Running',
      variant: 'danger',
    });
    if (isConfirmed) {
      setIsTimerRunning(false);
      setIsTimerPaused(false);
      setTimerElapsedSeconds(0);
      setTimerStartTime(null);
      localStorage.removeItem('injaazh_timesheet_active_timer');
      toast('Timer session discarded', { icon: '🗑️' });
    }
  };

  // Project Rates Server Action handler
  const handleSaveProjectRate = async (projectName: string, rate: number) => {
    setIsSavingProjectRate(true);
    const res = await saveProjectHourlyRate(projectName, rate);
    if (res.success) {
      toast.success(`Pre-set rate for "${projectName}" set to $${rate}/hr`);
      setProjectRates(prev => ({ ...prev, [projectName]: rate }));
      setProjectsList(prev => {
        const exists = prev.some(p => p.name.toLowerCase() === projectName.toLowerCase());
        if (exists) {
          return prev.map(p => p.name.toLowerCase() === projectName.toLowerCase() ? { ...p, rate } : p);
        }
        return [{ name: projectName, rate, status: 'Active' }, ...prev];
      });
      if (timerProject === projectName && !isTimerRunning) {
        setTimerRate(rate);
      }
    } else {
      toast.error(res.error || 'Failed to update project rate');
    }
    setIsSavingProjectRate(false);
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshKpis = async () => {
    const res = await getTimesheetKPIs();
    if (res.success && res.data) setKpis(res.data);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  useScrollLock(isModalOpen);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  // Time Entry Mode: 'duration' (direct hours & custom minutes) or 'range' (start & end time)
  const [timeEntryMode, setTimeEntryMode] = useState<'duration' | 'range'>('duration');

  const [saveAsDefaultRateForProject, setSaveAsDefaultRateForProject] = useState(false);

  const [formData, setFormData] = useState({ 
    project: '', 
    task: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    startTime: '09:00', 
    endTime: '10:00',
    durationHours: 1,
    durationMinutes: 0,
    hourlyRate: defaultRate,
    billable: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline rate editing state in table
  const [editingRateLogId, setEditingRateLogId] = useState<string | null>(null);
  const [tempInlineRate, setTempInlineRate] = useState<string>('');
  const [isSavingInlineRate, setIsSavingInlineRate] = useState(false);

  const formatTimeSeconds = (seconds: number) => {
    const totalMins = Math.round(seconds / 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const calculateDurationSecondsFromRange = (start: string, end: string) => {
    if (!start || !end) return 3600;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let s = (startH * 3600) + (startM * 60);
    let e = (endH * 3600) + (endM * 60);
    if (e < s) e += 24 * 3600;
    return Math.max(60, e - s);
  };

  const computeEndTimeFromDuration = (startTime: string, hours: number, minutes: number) => {
    const [startH, startM] = (startTime || '09:00').split(':').map(Number);
    const startSecs = (startH * 3600) + (startM * 60);
    const totalDurationSecs = Math.max(60, (hours * 3600) + (minutes * 60));
    const endSecs = (startSecs + totalDurationSecs) % (24 * 3600);
    const endH = Math.floor(endSecs / 3600);
    const endM = Math.floor((endSecs % 3600) / 60);
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const updateFromDuration = (hours: number, minutes: number, customStartTime?: string) => {
    const start = customStartTime || formData.startTime || '09:00';
    const computedEnd = computeEndTimeFromDuration(start, hours, minutes);
    setFormData(prev => ({
      ...prev,
      startTime: start,
      endTime: computedEnd,
      durationHours: hours,
      durationMinutes: minutes,
    }));
  };

  const updateFromTimeRange = (start: string, end: string) => {
    const diffSecs = calculateDurationSecondsFromRange(start, end);
    const totalMins = Math.round(diffSecs / 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    setFormData(prev => ({
      ...prev,
      startTime: start,
      endTime: end,
      durationHours: h,
      durationMinutes: m,
    }));
  };

  const currentDurationSeconds = useMemo(() => {
    if (timeEntryMode === 'duration') {
      const h = Number(formData.durationHours) || 0;
      const m = Number(formData.durationMinutes) || 0;
      return Math.max(60, (h * 3600) + (m * 60));
    } else {
      return calculateDurationSecondsFromRange(formData.startTime, formData.endTime);
    }
  }, [timeEntryMode, formData.durationHours, formData.durationMinutes, formData.startTime, formData.endTime]);

  const currentEstimatedEarnings = useMemo(() => {
    if (!formData.billable) return 0;
    return (currentDurationSeconds / 3600) * (formData.hourlyRate || 0);
  }, [currentDurationSeconds, formData.hourlyRate, formData.billable]);

  // Available Months
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    logs.forEach(log => {
      const d = new Date(log.date);
      monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    const now = new Date();
    monthSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [logs]);

  // All Available Projects (DB Projects + Logged Projects with pre-set rates)
  const allAvailableProjects = useMemo(() => {
    const map = new Map<string, { name: string; rate: number; status?: string }>();
    projectsList.forEach(p => {
      if (p.name) {
        const rate = projectRates[p.name] !== undefined ? projectRates[p.name] : p.rate || defaultRate;
        map.set(p.name.toLowerCase(), { ...p, rate });
      }
    });
    logs.forEach(l => {
      if (l.project && !map.has(l.project.toLowerCase())) {
        const rate = projectRates[l.project] !== undefined 
          ? projectRates[l.project] 
          : (typeof l.hourlyRate === 'number' ? l.hourlyRate : defaultRate);
        map.set(l.project.toLowerCase(), {
          name: l.project,
          rate,
          status: 'Historical'
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projectsList, logs, projectRates, defaultRate]);

  // Unique Projects from current logs
  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.project) set.add(l.project); });
    return Array.from(set).sort();
  }, [logs]);

  const monthFilterOptions = useMemo(() => {
    return availableMonths.map(m => {
      const [year, month] = m.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return { value: m, label: format(d, 'MMMM yyyy') };
    });
  }, [availableMonths]);

  const projectFilterOptions = useMemo(() => {
    return [
      { value: 'All', label: 'All Projects' },
      ...allAvailableProjects.map(p => ({ value: p.name, label: p.name }))
    ];
  }, [allAvailableProjects]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const d = new Date(log.date);
      const logMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const matchesMonth = logMonth === selectedMonth;
      const matchesProject = selectedProjectFilter === 'All' || log.project === selectedProjectFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || log.project?.toLowerCase().includes(q) || log.task?.toLowerCase().includes(q);
      return matchesMonth && matchesProject && matchesSearch;
    });
  }, [logs, selectedMonth, selectedProjectFilter, searchQuery]);

  // Monthly Calculations
  const monthlyTotalSeconds = useMemo(() => {
    return filteredLogs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
  }, [filteredLogs]);

  const monthlyBillableTotal = useMemo(() => {
    return filteredLogs.reduce((sum, l) => {
      if (l.billable === false) return sum;
      const rate = typeof l.hourlyRate === 'number' && l.hourlyRate >= 0 ? l.hourlyRate : defaultRate;
      return sum + ((l.durationSeconds / 3600) * rate);
    }, 0);
  }, [filteredLogs, defaultRate]);

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return format(d, 'MMMM yyyy');
  };

  // Open Modals
  const openModalForNew = () => {
    setEditingLogId(null);
    setTimeEntryMode('duration');
    setSaveAsDefaultRateForProject(false);
    const initialProj = allAvailableProjects.length > 0 ? allAvailableProjects[0].name : '';
    const initialRate = initialProj && projectRates[initialProj] !== undefined 
      ? projectRates[initialProj] 
      : defaultRate;

    setFormData({ 
      project: initialProj, 
      task: '', 
      date: format(new Date(), 'yyyy-MM-dd'), 
      startTime: '09:00', 
      endTime: '10:00',
      durationHours: 1,
      durationMinutes: 0,
      hourlyRate: initialRate,
      billable: true,
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (log: TimeLogItem) => {
    setEditingLogId(log._id);
    setTimeEntryMode('duration');
    setSaveAsDefaultRateForProject(false);
    const totalSecs = log.durationSeconds || 3600;
    const totalMins = Math.round(totalSecs / 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const effectiveRate = typeof log.hourlyRate === 'number' 
      ? log.hourlyRate 
      : (projectRates[log.project] !== undefined ? projectRates[log.project] : defaultRate);

    setFormData({ 
      project: log.project, 
      task: log.task, 
      date: format(new Date(log.date), 'yyyy-MM-dd'), 
      startTime: log.startTime || '09:00', 
      endTime: log.endTime || '10:00',
      durationHours: h,
      durationMinutes: m,
      hourlyRate: effectiveRate,
      billable: log.billable !== false,
    });
    setIsModalOpen(true);
  };

  const handleSelectModalProject = (projName: string) => {
    const preSetRate = projectRates[projName] !== undefined ? projectRates[projName] : defaultRate;
    setFormData(prev => ({
      ...prev,
      project: projName,
      hourlyRate: preSetRate,
    }));
  };

  // Inline rate save on table row
  const handleSaveInlineRate = async (logId: string) => {
    const parsed = parseFloat(tempInlineRate);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid hourly rate');
      return;
    }
    setIsSavingInlineRate(true);
    const res = await updateTimeLogRate(logId, parsed);
    if (res.success && res.data) {
      toast.success(`Hourly rate updated to $${parsed}/hr`);
      setLogs(logs.map(l => l._id === logId ? res.data : l));
      setEditingRateLogId(null);
      refreshKpis();
    } else {
      toast.error(res.error || 'Failed to update rate');
    }
    setIsSavingInlineRate(false);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project.trim() || !formData.task.trim() || !formData.date) {
      toast.error('Please fill project and task deliverable');
      return;
    }

    const durationSeconds = timeEntryMode === 'duration'
      ? Math.max(60, ((Number(formData.durationHours) || 0) * 3600) + ((Number(formData.durationMinutes) || 0) * 60))
      : calculateDurationSecondsFromRange(formData.startTime, formData.endTime);

    const calculatedEndTime = timeEntryMode === 'duration'
      ? computeEndTimeFromDuration(formData.startTime, Number(formData.durationHours) || 0, Number(formData.durationMinutes) || 0)
      : formData.endTime;

    setIsSubmitting(true);
    const rate = typeof formData.hourlyRate === 'number' && formData.hourlyRate >= 0 ? formData.hourlyRate : defaultRate;
    
    // Auto-save project rate if requested
    if (saveAsDefaultRateForProject && formData.project.trim()) {
      handleSaveProjectRate(formData.project.trim(), rate);
    }

    const payload = { 
      project: formData.project.trim(), 
      task: formData.task.trim(), 
      date: formData.date, 
      startTime: formData.startTime || '09:00', 
      endTime: calculatedEndTime || '10:00', 
      durationSeconds,
      hourlyRate: rate,
      billable: formData.billable,
    };

    if (editingLogId) {
      const res = await updateTimeLog(editingLogId, payload);
      if (res.success && res.data) { 
        toast.success(`Time log and rate ($${rate}/hr) updated!`); 
        setLogs(logs.map(l => l._id === editingLogId ? res.data : l)); 
        refreshKpis(); 
        setIsModalOpen(false); 
      } else {
        toast.error(res.error || 'Failed to update log');
      }
    } else {
      const res = await createTimeLog(payload);
      if (res.success && res.data) { 
        toast.success(`Logged ${formatTimeSeconds(durationSeconds)} @ $${rate}/hr!`); 
        setLogs([res.data, ...logs]); 
        refreshKpis(); 
        setIsModalOpen(false); 
      } else {
        toast.error(res.error || 'Failed to log time');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({ 
      title: 'Delete Time Log Entry?',
      message: 'Are you sure you want to delete this recorded time log and its billable hours?', 
      variant: 'danger',
      confirmText: 'Delete Entry'
    });
    if (!isConfirmed) return;

    const res = await deleteTimeLog(id);
    if (res.success) { 
      toast.success('Log entry deleted'); 
      setLogs(logs.filter(l => l._id !== id)); 
      refreshKpis(); 
    } else {
      toast.error('Failed to delete log');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export for the selected filter');
      return;
    }

    const headers = ['Date', 'Project/Client', 'Task Description', 'Start Time', 'End Time', 'Duration (Hours)', 'Hourly Rate ($/hr)', 'Billable Earnings ($)', 'Billable Status'];
    const rows = filteredLogs.map((log) => {
      const hours = (log.durationSeconds / 3600).toFixed(2);
      const rate = typeof log.hourlyRate === 'number' ? log.hourlyRate : defaultRate;
      const earnings = log.billable !== false ? ((log.durationSeconds / 3600) * rate).toFixed(2) : '0.00';
      return [
        `"${format(new Date(log.date), 'yyyy-MM-dd')}"`,
        `"${(log.project || '').replace(/"/g, '""')}"`,
        `"${(log.task || '').replace(/"/g, '""')}"`,
        `"${log.startTime}"`,
        `"${log.endTime}"`,
        hours,
        rate.toFixed(2),
        earnings,
        log.billable !== false ? 'Billable' : 'Non-Billable'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `injaazh-timesheet-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Timesheet CSV exported successfully!');
  };

  // Dynamic Real-time KPIs derived reactively from client logs, defaultRate, and projectRates
  const dynamicKPIs = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    // This week (Monday start)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekStartStr = format(startOfWeek, 'yyyy-MM-dd');

    // Current month prefix (YYYY-MM)
    const currentMonthPrefix = format(now, 'yyyy-MM');

    let secondsToday = 0;
    let secondsWeek = 0;
    let secondsMonth = 0;
    let billableValueMonth = 0;
    let billableSecondsMonth = 0;
    let totalLogsInMonth = 0;
    let sumRatesInMonth = 0;

    const projectSet = new Set<string>();

    logs.forEach(l => {
      const d = new Date(l.date);
      const dateStr = format(d, 'yyyy-MM-dd');
      const monthStr = format(d, 'yyyy-MM');
      const s = l.durationSeconds || 0;
      const rate = typeof l.hourlyRate === 'number' && l.hourlyRate >= 0 
        ? l.hourlyRate 
        : (l.project && projectRates[l.project] !== undefined ? projectRates[l.project] : defaultRate);
      const isBillable = l.billable !== false;

      if (l.project) projectSet.add(l.project);

      if (dateStr === todayStr) {
        secondsToday += s;
      }
      if (dateStr >= weekStartStr) {
        secondsWeek += s;
      }
      if (monthStr === currentMonthPrefix) {
        secondsMonth += s;
        totalLogsInMonth++;
        sumRatesInMonth += rate;
        if (isBillable) {
          billableValueMonth += (s / 3600) * rate;
          billableSecondsMonth += s;
        }
      }
    });

    const effectiveAverageRate = billableSecondsMonth > 0 
      ? (billableValueMonth / (billableSecondsMonth / 3600))
      : (totalLogsInMonth > 0 ? (sumRatesInMonth / totalLogsInMonth) : defaultRate);

    // Dynamic Chart Data for last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dynamicChartData: Array<{ dateStr: string; day: string; hours: number; max: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      dynamicChartData.push({
        dateStr,
        day: dayNames[d.getDay()],
        hours: 0,
        max: 10,
      });
    }

    logs.forEach(l => {
      const d = new Date(l.date);
      const dateStr = format(d, 'yyyy-MM-dd');
      const item = dynamicChartData.find(c => c.dateStr === dateStr);
      if (item) {
        item.hours += (l.durationSeconds || 0) / 3600;
      }
    });

    dynamicChartData.forEach(c => {
      c.hours = Math.round(c.hours * 10) / 10;
    });
    const maxVal = Math.max(1, ...dynamicChartData.map(c => c.hours));
    dynamicChartData.forEach(c => { c.max = maxVal; });

    return {
      today: secondsToday,
      week: secondsWeek,
      month: secondsMonth,
      billableValue: billableValueMonth,
      averageRate: effectiveAverageRate,
      uniqueProjectsCount: projectSet.size || allAvailableProjects.length,
      chartData: dynamicChartData,
    };
  }, [logs, defaultRate, projectRates, allAvailableProjects]);

  const chartData: any[] = dynamicKPIs.chartData;
  const globalMax = Math.max(0.1, ...chartData.map((d: any) => d.hours));
  const totalSevenDaySeconds = chartData.reduce((s: number, d: any) => s + (d.hours * 3600), 0);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 26 } } };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060608] text-slate-900 dark:text-white p-4 md:p-8 pt-6 pb-24 font-sans selection:bg-[#6324FC] selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6324FC]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#00E5FF]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1600px] mx-auto space-y-6 relative z-10">

        {/* ========================================================================= */}
        {/* EXECUTIVE SUITE HEADER (STANDARDIZED WITH DASHBOARD, /PROJECTS, /TASKS) */}
        {/* ========================================================================= */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 md:p-6 rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-sm relative overflow-hidden"
        >
          {/* Header Left: Glowing Badge & Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#6324FC]/10 border border-[#6324FC]/25 text-[#6324FC] dark:text-[#00E5FF] text-[10px] font-heading font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#6324FC] dark:shadow-[0_0_8px_#00E5FF]" />
                INJAAZH GLOBAL OS // WORKFORCE TIME &amp; BILLING ENGINE
              </div>
              <span className="text-xs font-sans text-secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Timesheets &amp; Billable Hours
            </h1>
            <p className="text-xs sm:text-sm font-sans text-secondary mt-1 max-w-2xl">
              Track sprint hours, calculate client billable earnings, and inspect time logs with customizable hourly rates.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Command shortcut button */}
            <button 
              type="button"
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-heading font-semibold transition-all group"
            >
              <Search size={14} className="group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors" />
              <span>Command</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[10px] font-mono text-secondary">⌘K</kbd>
            </button>

            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-heading font-semibold transition-all group shadow-sm"
              title="Download timesheet for selected month in CSV format"
            >
              <Download size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>Export CSV</span>
            </button>

            {/* AI Copilot Dispatch */}
            <button 
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { initialPrompt: 'Analyze my timesheet hours, weekly billable efficiency, and client revenue run rate' } }))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/30 hover:border-[#6324FC] text-slate-800 dark:text-[#edeae2] text-xs font-heading font-semibold transition-all hover:shadow-[0_0_15px_rgba(99,36,252,0.3)] shadow-sm"
            >
              <Sparkles size={14} className="text-[#6324FC] dark:text-[#00E5FF] animate-pulse" />
              <span>AI Copilot</span>
            </button>

            {/* + Log Time Manually Laser Beam CTA */}
            <button 
              type="button"
              onClick={openModalForNew}
              className="h-9 group relative p-[2px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(99,36,252,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5),0_0_20px_rgba(236,72,153,0.35)]"
            >
              <span 
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] blur-[8px] opacity-85 pointer-events-none" 
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />
              <span 
                className="absolute top-1/2 left-1/2 w-[450%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite] opacity-100 pointer-events-none" 
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00e5ff 110deg, #6324fc 140deg, #ec4899 170deg, transparent 210deg, transparent 360deg)'
                }}
              />
              <div className="relative z-10 w-full h-full px-3.5 rounded-[10px] bg-white dark:bg-[#0a0a0d] group-hover:bg-slate-50 dark:group-hover:bg-[#121218] text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-2 transition-all">
                <Clock size={14} className="text-[#00E5FF] group-hover:rotate-6 group-hover:scale-110 drop-shadow-[0_0_6px_#00E5FF] transition-transform duration-300" />
                <span className="tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-[#6324FC] dark:group-hover:from-white dark:group-hover:via-[#00E5FF] dark:group-hover:to-[#EC4899] transition-all">
                  + Log Time Manually
                </span>
              </div>
            </button>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* PROJECT-WISE LIVE TIME TRACKER ENGINE */}
        {/* ========================================================================= */}
        <motion.div
          variants={itemVariants}
          className="relative rounded-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 shadow-lg overflow-hidden p-4 sm:p-5"
        >
          {/* Neon top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent opacity-80" />

          {/* Header row of tracker */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-3.5 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] font-heading font-bold">
                {isTimerRunning ? (
                  isTimerPaused ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]" />
                      <span className="text-amber-500 uppercase tracking-widest text-[10px]">Session Paused</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_#f43f5e]" />
                      <span className="text-rose-500 uppercase tracking-widest text-[10px] font-extrabold">Recording Live Sprint</span>
                    </>
                  )
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-emerald-500 dark:text-emerald-400 uppercase tracking-widest text-[10px]">Project Live Tracker</span>
                  </>
                )}
              </div>

              <span className="text-xs text-secondary hidden sm:inline">
                {isTimerRunning 
                  ? `Active Session: ${timerProject || 'Untitled'}`
                  : 'Track live hours with automatic project-specific hourly billing rates'}
              </span>
            </div>

            {/* Project Rates Quick Action */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProjectRatesModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-[#6324FC]/50 text-secondary hover:text-slate-900 dark:hover:text-white text-xs font-heading font-semibold transition-all shadow-xs"
                title="View and configure project default hourly rates"
              >
                <Zap size={12} className="text-amber-500" />
                <span>Project Rates</span>
                <span className="px-1.5 py-0.2 rounded-md bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-mono text-[10px] font-bold">
                  {Object.keys(projectRates).length}
                </span>
              </button>
            </div>
          </div>

          {/* Main Tracker Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            {/* Project Selector (Col 1-4) */}
            <div className="lg:col-span-4 relative">
              <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1 flex items-center justify-between">
                <span>Project / Client *</span>
                {timerProject && projectRates[timerProject] !== undefined && (
                  <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-0.5">
                    <Zap size={10} /> Pre-set: ${projectRates[timerProject]}/hr
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={timerProject}
                  onChange={(e) => handleSelectTimerProject(e.target.value)}
                  disabled={isTimerRunning}
                  placeholder="Select or type project..."
                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] disabled:opacity-75 transition-colors font-medium placeholder:text-secondary"
                  list="tracker-projects-datalist"
                />
                <datalist id="tracker-projects-datalist">
                  {allAvailableProjects.map(p => (
                    <option key={p.name} value={p.name}>
                      ${p.rate}/hr — {p.status || 'Active'}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* Task Input (Col 5-7) */}
            <div className="lg:col-span-3">
              <label className="block text-[10px] font-heading font-bold text-secondary uppercase tracking-widest mb-1">
                Current Task / Deliverable
              </label>
              <input
                type="text"
                value={timerTask}
                onChange={(e) => setTimerTask(e.target.value)}
                placeholder="What deliverable are you working on?"
                className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary"
              />
            </div>

            {/* Live Stopwatch & Live Earnings Display (Col 8-10) */}
            <div className="lg:col-span-3 flex items-center justify-between sm:justify-start lg:justify-center gap-4 px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/5">
              <div>
                <span className="text-[10px] text-secondary font-heading font-bold block uppercase tracking-wider">
                  Elapsed Time
                </span>
                <span className="font-mono font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-wider">
                  {formatStopwatch(timerElapsedSeconds)}
                </span>
              </div>

              <div className="border-l border-black/10 dark:border-white/10 pl-3">
                <span className="text-[10px] text-secondary font-heading font-bold block uppercase tracking-wider">
                  Live Earnings ({timerBillable ? `$${timerRate}/hr` : 'Unbilled'})
                </span>
                <span className="font-mono font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                  ${timerLiveEarnings.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions: Start / Pause / Stop / Discard (Col 11-12) */}
            <div className="lg:col-span-2 flex items-center justify-end gap-2">
              {!isTimerRunning ? (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs bg-[#6324FC] hover:bg-[#521bd6] text-white shadow-[0_0_20px_rgba(99,36,252,0.4)] hover:shadow-[0_0_30px_rgba(99,36,252,0.6)] active:scale-95 transition-all"
                >
                  <Play size={14} className="fill-white" />
                  <span>Start Timer</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={handlePauseResumeTimer}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl font-heading font-bold text-xs bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white transition-all"
                    title={isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
                  >
                    {isTimerPaused ? <Play size={13} className="fill-current text-emerald-500" /> : <Pause size={13} className="text-amber-500" />}
                    <span>{isTimerPaused ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStopAndSaveTimer}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl font-heading font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 transition-all"
                    title="Stop timer and log to timesheet"
                  >
                    <Square size={12} className="fill-white" />
                    <span>Stop &amp; Log</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDiscardTimer}
                    className="p-2 rounded-xl text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Discard current session"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* EXECUTIVE WORK TELEMETRY KPI CARDS (DASHBOARD MATCHING 6-GRID) */}
        {/* ========================================================================= */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-2.5">
              <Activity size={16} className="text-[#6324FC]" /> Billable Telemetry &amp; Velocity
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]" />
              <span>Live Time Tracker Synced</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
            {/* Card 1: Today's Hours */}
            <div 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#6324FC]/60 hover:shadow-[0_16px_36px_rgba(99,36,252,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#6324FC]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#6324FC] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#6324FC]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#6324FC]/15 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] dark:text-[#a78bfa] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,36,252,0.6)] group-hover:border-[#6324FC] transition-all duration-300 shadow-sm">
                  <Clock size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#a78bfa] bg-[#6324FC]/10 px-2.5 py-1 rounded-lg border border-[#6324FC]/20 group-hover:border-[#6324FC]/40 transition-colors">
                  Today
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Hours Today</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#6324FC] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#6324FC] transition-all">
                  {formatTimeSeconds(dynamicKPIs.today)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Logged sprint work today
                </p>
              </div>
            </div>

            {/* Card 2: Weekly Velocity */}
            <div 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#00E5FF]/60 hover:shadow-[0_16px_36px_rgba(0,229,255,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#00E5FF]/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#00E5FF]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-[#00E5FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] group-hover:border-[#00E5FF] transition-all duration-300 shadow-sm">
                  <Calendar size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-cyan-600 dark:text-[#00E5FF] bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                  This Week
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Weekly Velocity</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-cyan-600 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#00E5FF] transition-all">
                  {formatTimeSeconds(dynamicKPIs.week)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Total hours this week
                </p>
              </div>
            </div>

            {/* Card 3: Monthly Total Hours */}
            <div 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#F59E0B]/60 hover:shadow-[0_16px_36px_rgba(245,158,11,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#F59E0B]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#F59E0B]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] group-hover:border-[#F59E0B] transition-all duration-300 shadow-sm">
                  <Flame size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                  Month Run
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Monthly Total Hours</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#F59E0B] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#F59E0B] transition-all">
                  {formatTimeSeconds(dynamicKPIs.month)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Recorded in current month
                </p>
              </div>
            </div>

            {/* Card 4: Monthly Billable Value */}
            <div 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#10B981]/60 hover:shadow-[0_16px_36px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#10B981]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#10B981]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] group-hover:border-[#10B981] transition-all duration-300 shadow-sm">
                  <DollarSign size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                  Revenue
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Monthly Billable</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#10B981] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#10B981] transition-all">
                  ${dynamicKPIs.billableValue.toFixed(2)}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Total client billable earnings
                </p>
              </div>
            </div>

            {/* Card 5: Average Hourly Rate */}
            <div 
              onClick={() => {
                setTempDefaultRateInput(defaultRate.toString());
                setIsEditingDefaultRate(true);
              }}
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-violet-500/60 hover:shadow-[0_16px_36px_rgba(139,92,246,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-violet-500/20 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-violet-500 to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#8B5CF6]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] group-hover:border-violet-400 transition-all duration-300 shadow-sm">
                  <TrendingUp size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20 group-hover:border-violet-500/40 transition-colors flex items-center gap-1">
                  <span>Customizable</span>
                  <Edit3 size={10} />
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Effective Hourly Rate</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-violet-600 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-violet-400 transition-all">
                  ${dynamicKPIs.averageRate % 1 === 0 ? dynamicKPIs.averageRate : dynamicKPIs.averageRate.toFixed(2)}/hr
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Default rate: ${defaultRate % 1 === 0 ? defaultRate : defaultRate.toFixed(2)}/hr (Click to edit)
                </p>
              </div>
            </div>

            {/* Card 6: Active Projects Tracked */}
            <div 
              className="group glass-card rounded-2xl p-5 lg:p-6 min-h-[175px] flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#EC4899]/60 hover:shadow-[0_16px_36px_rgba(236,72,153,0.22)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#EC4899]/25 blur-[35px] rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 group-hover:w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#EC4899] to-transparent transition-all duration-500 opacity-90 shadow-[0_0_10px_#EC4899]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-500 dark:text-[#EC4899] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] group-hover:border-[#EC4899] transition-all duration-300 shadow-sm">
                  <Activity size={21} />
                </div>
                <span className="text-xs font-heading font-bold text-pink-500 dark:text-[#EC4899] bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20 group-hover:border-pink-500/40 transition-colors">
                  Clients
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-heading font-bold text-secondary uppercase tracking-wider mb-1">Active Projects</p>
                <p className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5 group-hover:text-[#EC4899] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-[#EC4899] transition-all">
                  {dynamicKPIs.uniqueProjectsCount || uniqueProjects.length}
                </p>
                <p className="text-xs font-sans text-secondary/80 mt-1.5 truncate">
                  Unique contracts tracked
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* LAST 7 DAYS ACTIVITY VISUALIZER */}
        {/* ========================================================================= */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#6324FC]/10 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                <Activity size={15} />
              </div>
              <h2 className="text-xs font-heading font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
                Last 7 Days Sprint Activity
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-secondary font-mono">
                7-day total: <span className="text-slate-900 dark:text-white font-extrabold">{formatTimeSeconds(totalSevenDaySeconds)}</span>
              </span>
              <span className="text-xs text-secondary font-mono">
                Est. Value: <span className="text-emerald-500 font-extrabold">${((totalSevenDaySeconds / 3600) * dynamicKPIs.averageRate).toFixed(2)}</span>
              </span>
            </div>
          </div>

          <div className="flex items-end gap-3 sm:gap-4" style={{ height: 135 }}>
            {chartData.map((d: any, i: number) => {
              const heightPercent = d.hours > 0 ? Math.max((d.hours / globalMax) * 100, 8) : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group cursor-default h-full">
                  <div className="h-4 flex items-end justify-center shrink-0">
                    {d.hours > 0 && (
                      <span className="text-[10px] font-mono font-bold text-secondary group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors leading-none">
                        {d.hours}h
                      </span>
                    )}
                  </div>
                  <div className="w-full flex-1 relative flex items-end bg-slate-50 dark:bg-[#060608] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
                    {d.hours > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.8, delay: i * 0.07 + 0.15, ease: 'easeOut' }}
                        className="w-full bg-gradient-to-t from-[#6324FC] to-[#00E5FF] group-hover:brightness-110 transition-all rounded-t-lg shadow-sm"
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-heading font-bold text-secondary group-hover:text-slate-900 dark:group-hover:text-white transition-colors shrink-0">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* DETAILED LOG PANEL & TOOLBAR */}
        {/* ========================================================================= */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm"
        >
          {/* Panel Header & Filters */}
          <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/5">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xs sm:text-sm font-heading font-extrabold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <span>Detailed Work Log</span>
                  <span className="text-secondary normal-case font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5">
                    {filteredLogs.length} entries
                  </span>
                </h2>
              </div>

              {/* Toolbar Controls */}
              <div className="flex flex-wrap items-center gap-2 flex-1 xl:justify-end">
                {/* Search */}
                <div className="relative min-w-[180px] max-w-xs flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type="text" 
                    placeholder="Search task or project..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white text-xs rounded-xl pl-8 pr-7 py-2 focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-slate-900 dark:hover:text-white"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* Month Portal Filter */}
                <PortalSelect
                  value={selectedMonth}
                  onChange={val => setSelectedMonth(val)}
                  options={monthFilterOptions}
                  labelPrefix="Month"
                  minWidth={175}
                  size="sm"
                />

                {/* Project Portal Filter */}
                <PortalSelect
                  value={selectedProjectFilter}
                  onChange={val => setSelectedProjectFilter(val)}
                  options={projectFilterOptions}
                  labelPrefix="Project"
                  minWidth={165}
                  size="sm"
                />

                {/* Default Hourly Rate Setter in Toolbar */}
                <div className="flex items-center">
                  {isEditingDefaultRate ? (
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#060608] border border-[#6324FC] rounded-xl px-2 py-1">
                      <span className="text-xs text-secondary font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={tempDefaultRateInput}
                        onChange={(e) => setTempDefaultRateInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveDefaultRate();
                          } else if (e.key === 'Escape') {
                            setIsEditingDefaultRate(false);
                          }
                        }}
                        className="w-14 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveDefaultRate}
                        className="p-1 rounded bg-[#6324FC] text-white hover:bg-[#521bd6] transition-colors"
                        title="Save rate"
                      >
                        <Check size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDefaultRate(false)}
                        className="p-1 rounded text-secondary hover:text-rose-500 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTempDefaultRateInput(defaultRate.toString());
                        setIsEditingDefaultRate(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#060608] hover:border-[#6324FC]/60 text-xs font-heading font-semibold text-secondary hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
                      title="Click to set your default hourly billing rate"
                    >
                      <DollarSign size={12} className="text-amber-500" />
                      <span>Rate: <strong className="font-mono text-slate-900 dark:text-white">${defaultRate % 1 === 0 ? defaultRate : defaultRate.toFixed(2)}/hr</strong></span>
                      <Edit3 size={10} className="text-secondary ml-0.5" />
                    </button>
                  )}
                </div>

                {/* Project Rates Master Modal Opener */}
                <button
                  type="button"
                  onClick={() => setIsProjectRatesModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#060608] hover:border-[#6324FC]/60 text-xs font-heading font-semibold text-secondary hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
                  title="Configure pre-set hourly rates per project"
                >
                  <Zap size={13} className="text-amber-500" />
                  <span>Project Rates</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] font-mono text-[10px] font-bold">
                    {Object.keys(projectRates).length}
                  </span>
                </button>

                {/* Reset Filters */}
                {(searchQuery || selectedProjectFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedProjectFilter('All');
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-heading font-semibold transition-colors flex items-center gap-1"
                    title="Clear search and filters"
                  >
                    <RotateCcw size={11} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredLogs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-[#060608]/70 border-b border-black/5 dark:border-white/5">
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Date</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Project/Client</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Task Description</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">Time Window</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-right">Duration</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-right">Hourly Rate</th>
                      <th className="px-5 py-3 text-[10px] font-heading font-bold text-secondary uppercase tracking-widest text-right">Billable Earnings</th>
                      <th className="px-5 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {filteredLogs.map((log) => {
                      const rate = typeof log.hourlyRate === 'number' && log.hourlyRate >= 0 ? log.hourlyRate : defaultRate;
                      const isBillable = log.billable !== false;
                      const earnings = isBillable ? ((log.durationSeconds / 3600) * rate) : 0;

                      return (
                        <tr
                          key={log._id}
                          className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Date */}
                          <td className="px-5 py-3.5 text-xs font-mono text-secondary whitespace-nowrap">
                            {format(new Date(log.date), 'MMM dd, yyyy')}
                          </td>

                          {/* Project/Client */}
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF] text-[11px] font-heading font-bold border border-[#6324FC]/20 whitespace-nowrap">
                              {log.project}
                            </span>
                          </td>

                          {/* Task */}
                          <td className="px-5 py-3.5 text-xs text-slate-800 dark:text-slate-200 max-w-[260px] truncate font-medium">
                            {log.task}
                          </td>

                          {/* Time Window */}
                          <td className="px-5 py-3.5 text-xs font-mono text-secondary whitespace-nowrap">
                            {log.startTime} – {log.endTime}
                          </td>

                          {/* Duration */}
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-xs font-heading font-bold font-mono text-slate-900 dark:text-white">
                              {formatTimeSeconds(log.durationSeconds)}
                            </span>
                          </td>

                          {/* Hourly Rate (Click to Quick-Edit) */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            {editingRateLogId === log._id ? (
                              <div className="inline-flex items-center gap-1 bg-white dark:bg-[#060608] border border-[#6324FC] rounded-lg p-1 shadow-sm">
                                <span className="text-[10px] font-mono font-bold text-secondary">$</span>
                                <input 
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={tempInlineRate}
                                  onChange={(e) => setTempInlineRate(e.target.value)}
                                  className="w-14 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveInlineRate(log._id);
                                    if (e.key === 'Escape') setEditingRateLogId(null);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineRate(log._id)}
                                  disabled={isSavingInlineRate}
                                  className="p-1 rounded bg-[#6324FC] text-white hover:bg-[#521bd6] transition-colors"
                                  title="Save rate"
                                >
                                  {isSavingInlineRate ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRateLogId(null)}
                                  className="p-1 rounded text-secondary hover:text-rose-500 transition-colors"
                                  title="Cancel"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRateLogId(log._id);
                                  setTempInlineRate(rate.toString());
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-[#6324FC]/50 text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] transition-all group/rate"
                                title="Click to edit rate directly"
                              >
                                <span>${rate.toFixed(2)}/hr</span>
                                <Edit3 size={10} className="opacity-0 group-hover/rate:opacity-100 transition-opacity text-secondary" />
                              </button>
                            )}
                          </td>

                          {/* Billable Earnings */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            {isBillable ? (
                              <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                ${earnings.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-secondary uppercase bg-black/5 px-2 py-0.5 rounded">
                                Non-billable
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openModalForEdit(log)} 
                                className="p-1.5 text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF] rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                title="Edit log & rate"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDelete(log._id)} 
                                className="p-1.5 text-secondary hover:text-rose-500 rounded-lg transition-colors hover:bg-rose-500/10"
                                title="Delete log"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Monthly Summary Footer */}
              <div className="px-5 py-4 border-t border-black/5 dark:border-white/5 bg-slate-50/70 dark:bg-[#060608]/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-[#6324FC] dark:text-[#00E5FF]" />
                    <span className="text-xs font-heading font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {formatMonthLabel(selectedMonth)} Summary
                    </span>
                    <span className="text-xs text-secondary font-mono">— {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}</span>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-[#6324FC] dark:text-[#00E5FF]" />
                      <span className="text-xs text-secondary">Total Time:</span>
                      <span className="text-xs font-heading font-extrabold font-mono text-slate-900 dark:text-white">
                        {formatTimeSeconds(monthlyTotalSeconds)}
                      </span>
                    </div>

                    <div className="w-px h-4 bg-black/10 dark:bg-white/10" />

                    <div className="flex items-center gap-2">
                      <DollarSign size={13} className="text-emerald-500" />
                      <span className="text-xs text-secondary">Billable Value:</span>
                      <span className="text-sm font-heading font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        ${monthlyBillableTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="w-px h-4 bg-black/10 dark:bg-white/10" />

                    <span className="text-xs text-secondary font-mono">
                      Avg Rate: <strong className="text-slate-900 dark:text-white">${monthlyTotalSeconds > 0 ? (monthlyBillableTotal / (monthlyTotalSeconds / 3600)).toFixed(2) : defaultRate.toFixed(2)}/hr</strong>
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#6324FC]/10 border border-[#6324FC]/25 flex items-center justify-center mb-3 text-[#6324FC] dark:text-[#00E5FF]">
                <Clock size={22} />
              </div>
              <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-white mb-1">
                {searchQuery ? 'No matching logs found' : `No logs recorded for ${formatMonthLabel(selectedMonth)}`}
              </h3>
              <p className="text-xs text-secondary max-w-sm mb-4 leading-relaxed">
                {searchQuery 
                  ? 'Try a different search keyword or reset the filter criteria.' 
                  : 'Log your work hours manually to start calculating client billable revenue.'}
              </p>
              {!searchQuery && (
                <button 
                  onClick={openModalForNew} 
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-heading font-bold text-xs bg-[#6324FC] text-white hover:bg-[#521bd6] shadow-[0_0_15px_rgba(99,36,252,0.4)] transition-all"
                >
                  <Plus size={14} /> Log Time Manually
                </button>
              )}
            </div>
          )}
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* MANUAL ENTRY / EDIT TIME LOG MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#6324FC]/10 border border-[#6324FC]/25 flex items-center justify-center text-[#6324FC] dark:text-[#00E5FF]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-heading font-bold text-slate-900 dark:text-white">
                      {editingLogId ? 'Edit Work Time Log' : 'Log Time Manually'}
                    </h3>
                    <p className="text-xs text-secondary font-sans mt-0.5">
                      Record sprint hours and configure billable hourly rate.
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-1.5 text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {/* Project */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest">
                      Project / Client Name *
                    </label>
                    {formData.project && projectRates[formData.project] !== undefined && (
                      <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
                        <Zap size={10} /> Pre-set: ${projectRates[formData.project]}/hr
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.project} 
                      onChange={e => handleSelectModalProject(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary font-medium" 
                      placeholder="e.g. Upwork Milestone 2 or Acme Corp Redesign" 
                      list="manual-modal-projects-datalist"
                      required 
                    />
                    <datalist id="manual-modal-projects-datalist">
                      {allAvailableProjects.map(p => (
                        <option key={p.name} value={p.name}>
                          ${p.rate}/hr — {p.status || 'Active'}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  {allAvailableProjects.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto hide-scrollbar">
                      <span className="text-[10px] text-secondary shrink-0">Projects:</span>
                      {allAvailableProjects.slice(0, 6).map(p => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleSelectModalProject(p.name)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors shrink-0 ${
                            formData.project.toLowerCase() === p.name.toLowerCase()
                              ? 'bg-[#6324FC] text-white font-bold'
                              : 'bg-black/5 dark:bg-white/5 hover:bg-[#6324FC]/10 text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF]'
                          }`}
                        >
                          {p.name} (${p.rate}/hr)
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Task Description */}
                <div>
                  <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">
                    Task Deliverable Description *
                  </label>
                  <input 
                    type="text" 
                    value={formData.task} 
                    onChange={e => setFormData({...formData, task: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors placeholder:text-secondary" 
                    placeholder="e.g. Implemented responsive UI & Backend API auth" 
                    required 
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-heading font-bold text-secondary mb-1.5 uppercase tracking-widest">
                    Date *
                  </label>
                  <DatePicker
                    selected={new Date(formData.date + 'T00:00:00')}
                    onChange={(date: Date | null) => setFormData({...formData, date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')})}
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                    dateFormat="MMMM d, yyyy" 
                    required 
                    popperPlacement="bottom-start" 
                    popperClassName="z-[70]"
                    renderCustomHeader={({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                      <div className="flex justify-between items-center mb-3 px-2">
                        <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="text-secondary hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-md transition-colors"><ChevronLeft size={14} /></button>
                        <div className="text-slate-900 dark:text-white font-heading font-bold text-xs">{format(date, 'MMMM yyyy')}</div>
                        <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="text-secondary hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-md transition-colors"><ChevronRight size={14} /></button>
                      </div>
                    )}
                  />
                </div>

                {/* TIME & DURATION ENTRY (ঘণ্টা ও ইচ্ছামত মিনিট বসানোর ফুল কন্ট্রোল) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5">
                    <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={13} className="text-[#6324FC] dark:text-[#00E5FF]" />
                      <span>Duration &amp; Logged Time</span>
                    </label>

                    {/* Mode Toggle: Duration vs Range */}
                    <div className="flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/5">
                      <button
                        type="button"
                        onClick={() => setTimeEntryMode('duration')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-heading font-bold transition-all ${
                          timeEntryMode === 'duration'
                            ? 'bg-[#6324FC] text-white shadow-xs'
                            : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        By Duration (Hrs &amp; Mins)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeEntryMode('range')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-heading font-bold transition-all ${
                          timeEntryMode === 'range'
                            ? 'bg-[#6324FC] text-white shadow-xs'
                            : 'text-secondary hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        By Time Range (Start &amp; End)
                      </button>
                    </div>
                  </div>

                  {timeEntryMode === 'duration' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Hours */}
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary mb-1 uppercase tracking-widest">
                            Hours (ঘণ্টা)
                          </label>
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              max="24"
                              step="1"
                              value={formData.durationHours}
                              onChange={(e) => {
                                const h = Math.max(0, parseInt(e.target.value) || 0);
                                updateFromDuration(h, formData.durationMinutes);
                              }}
                              className="w-full bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl pl-3.5 pr-12 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                              placeholder="1"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-mono">
                              hrs
                            </span>
                          </div>
                        </div>

                        {/* Custom Arbitrary Minutes */}
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary mb-1 uppercase tracking-widest flex items-center justify-between">
                            <span>Minutes (ইচ্ছামত মিনিট)</span>
                            <span className="text-[9px] text-[#6324FC] dark:text-[#00E5FF] font-mono lowercase">0-59 mins</span>
                          </label>
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              max="1440"
                              step="1"
                              value={formData.durationMinutes}
                              onChange={(e) => {
                                const m = Math.max(0, parseInt(e.target.value) || 0);
                                updateFromDuration(formData.durationHours, m);
                              }}
                              className="w-full bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl pl-3.5 pr-14 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                              placeholder="30"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-mono">
                              mins
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Presets Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-secondary shrink-0 font-sans">Quick Presets:</span>
                        {[
                          { label: '15m', h: 0, m: 15 },
                          { label: '30m', h: 0, m: 30 },
                          { label: '45m', h: 0, m: 45 },
                          { label: '1h', h: 1, m: 0 },
                          { label: '1h 30m', h: 1, m: 30 },
                          { label: '2h', h: 2, m: 0 },
                          { label: '3h', h: 3, m: 0 },
                          { label: '4h', h: 4, m: 0 },
                          { label: '8h', h: 8, m: 0 },
                        ].map((p) => {
                          const isSelected = formData.durationHours === p.h && formData.durationMinutes === p.m;
                          return (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => updateFromDuration(p.h, p.m)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                                isSelected
                                  ? 'bg-[#6324FC] text-white shadow-xs'
                                  : 'bg-black/5 dark:bg-white/5 hover:bg-[#6324FC]/10 text-secondary hover:text-[#6324FC] dark:hover:text-[#00E5FF]'
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-secondary pt-1 font-mono">
                        <span>Window: {formData.startTime} → {formData.endTime}</span>
                        <span className="text-slate-900 dark:text-white font-bold">
                          Total: {formatTimeSeconds(currentDurationSeconds)} ({Math.round(currentDurationSeconds / 60)} mins)
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Time Range Mode (Any minute selectable) */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary mb-1 uppercase tracking-widest">
                            Start Time (যেকোনো মিনিট) *
                          </label>
                          <input 
                            type="time" 
                            step="60"
                            value={formData.startTime} 
                            onChange={(e) => updateFromTimeRange(e.target.value, formData.endTime)}
                            className="w-full bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                            required 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-heading font-bold text-secondary mb-1 uppercase tracking-widest">
                            End Time (যেকোনো মিনিট) *
                          </label>
                          <input 
                            type="time" 
                            step="60"
                            value={formData.endTime} 
                            onChange={(e) => updateFromTimeRange(formData.startTime, e.target.value)}
                            className="w-full bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] transition-colors"
                            required 
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-secondary pt-1 font-mono">
                        <span>Duration Computed:</span>
                        <span className="text-slate-900 dark:text-white font-bold">
                          {formatTimeSeconds(currentDurationSeconds)} ({Math.round(currentDurationSeconds / 60)} mins)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* HOURLY RATE INPUT & BILLABLE TOGGLE (ইচ্ছামত রেট বসানোর সম্পূর্ণ স্বাধীনতা) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign size={13} className="text-emerald-500" />
                      <span>Hourly Rate &amp; Earnings (ইচ্ছামত রেট)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.billable}
                        onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                        className="rounded accent-[#6324FC] cursor-pointer"
                      />
                      <span className="text-xs font-heading font-semibold text-slate-800 dark:text-slate-200">
                        Billable
                      </span>
                    </label>
                  </div>

                  {/* Rate Input */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-secondary">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.hourlyRate}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setFormData({ ...formData, hourlyRate: isNaN(val) ? 0 : val });
                        }}
                        disabled={!formData.billable}
                        placeholder="35.00"
                        className="w-full bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl pl-8 pr-14 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC] disabled:opacity-40 transition-colors"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-secondary">
                        / hr
                      </span>
                    </div>

                    {/* Duration badge */}
                    <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a0a0d] border border-black/5 dark:border-white/5 text-right shrink-0">
                      <span className="text-[10px] text-secondary block font-sans">Total Duration</span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {formatTimeSeconds(currentDurationSeconds)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Rate Preset Chips */}
                  {formData.billable && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-secondary shrink-0 font-sans">Quick Rates:</span>
                      {[15, 20, 25, 30, 35, 50, 75, 100].map((r) => {
                        const isSelected = formData.hourlyRate === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setFormData({ ...formData, hourlyRate: r })}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                              isSelected
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-black/5 dark:bg-white/5 hover:bg-emerald-500/10 text-secondary hover:text-emerald-500'
                            }`}
                          >
                            ${r}/hr
                          </button>
                        );
                      })}
                      {defaultRate && ![15, 20, 25, 30, 35, 50, 75, 100].includes(defaultRate) && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, hourlyRate: defaultRate })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                            formData.hourlyRate === defaultRate
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-black/5 dark:bg-white/5 hover:bg-emerald-500/10 text-secondary hover:text-emerald-500'
                          }`}
                        >
                          Default (${defaultRate})
                        </button>
                      )}
                    </div>
                  )}

                  {/* Live Calculation Preview */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-black/5 dark:border-white/5 text-xs">
                    <div className="flex items-center gap-1.5 text-secondary">
                      <Sparkles size={12} className="text-amber-500" />
                      <span>Client Billable Total:</span>
                      <span className="text-[10px] font-mono">
                        ({(currentDurationSeconds / 3600).toFixed(2)}h × ${formData.hourlyRate || 0})
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                      ${currentEstimatedEarnings.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Save as default rate for this project checkbox */}
                {formData.project.trim() && (
                  <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/10 cursor-pointer text-xs select-none hover:border-[#6324FC]/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={saveAsDefaultRateForProject}
                      onChange={(e) => setSaveAsDefaultRateForProject(e.target.checked)}
                      className="rounded accent-[#6324FC] cursor-pointer"
                    />
                    <span className="text-secondary text-[11px] font-sans">
                      Save <strong className="text-slate-900 dark:text-white font-mono">${formData.hourlyRate}/hr</strong> as default pre-set rate for <strong className="text-[#6324FC] dark:text-[#00E5FF]">"{formData.project}"</strong>
                    </span>
                  </label>
                )}

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-black/5 dark:border-white/10 flex justify-end gap-2.5">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 rounded-xl font-heading font-bold text-xs bg-slate-100 dark:bg-white/5 text-secondary hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-heading font-bold text-xs bg-[#6324FC] hover:bg-[#521bd6] text-white shadow-[0_0_15px_rgba(99,36,252,0.4)] disabled:opacity-50 transition-all"
                  >
                    {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                    <span>{editingLogId ? 'Save Changes' : 'Record Time Entry'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PROJECT HOURLY RATES MASTER MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isProjectRatesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProjectRatesModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-heading font-bold text-slate-900 dark:text-white">
                      Project Hourly Rates Manager
                    </h3>
                    <p className="text-xs text-secondary font-sans mt-0.5">
                      Configure pre-set billing rates per project. Live tracking and manual entries auto-apply these rates.
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsProjectRatesModalOpen(false)} 
                  className="p-1.5 text-secondary hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {/* Add New Project Rate Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060608] border border-black/5 dark:border-white/10 space-y-3">
                  <label className="text-[10px] font-heading font-bold text-secondary uppercase tracking-widest block">
                    + Set Rate for New or Custom Project
                  </label>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Project name (e.g. Acme Corp Mobile App)"
                      value={newProjectRateName}
                      onChange={e => setNewProjectRateName(e.target.value)}
                      className="flex-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC]"
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-secondary">$</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="35"
                        value={newProjectRateVal}
                        onChange={e => setNewProjectRateVal(e.target.value)}
                        className="w-full bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newProjectRateName.trim()) {
                          toast.error('Enter a project name');
                          return;
                        }
                        const r = parseFloat(newProjectRateVal) || defaultRate;
                        await handleSaveProjectRate(newProjectRateName.trim(), r);
                        setNewProjectRateName('');
                      }}
                      disabled={isSavingProjectRate}
                      className="px-4 py-2 rounded-xl font-heading font-bold text-xs bg-[#6324FC] hover:bg-[#521bd6] text-white transition-all shrink-0 shadow-sm"
                    >
                      Save Rate
                    </button>
                  </div>
                </div>

                {/* Search Filter for projects */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type="text"
                    placeholder="Filter configured projects..."
                    value={searchProjectRateQuery}
                    onChange={e => setSearchProjectRateQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 text-xs rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC]"
                  />
                </div>

                {/* Projects List with Inline Editable Rate */}
                <div className="divide-y divide-black/5 dark:divide-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#0a0a0d]">
                  {allAvailableProjects
                    .filter(p => !searchProjectRateQuery || p.name.toLowerCase().includes(searchProjectRateQuery.toLowerCase()))
                    .map((p) => {
                      const currentRate = projectRates[p.name] !== undefined ? projectRates[p.name] : p.rate || defaultRate;
                      return (
                        <div key={p.name} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-heading font-bold text-slate-900 dark:text-white">
                                {p.name}
                              </span>
                              {p.status && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/5 dark:bg-white/5 text-secondary">
                                  {p.status}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-secondary font-sans block mt-0.5">
                              Default billing rate applied during live tracking and manual logging
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Quick Chips */}
                            <div className="hidden sm:flex items-center gap-1">
                              {[25, 35, 50, 75, 100].map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => handleSaveProjectRate(p.name, r)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                                    currentRate === r
                                      ? 'bg-emerald-500 text-white font-bold'
                                      : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 text-secondary'
                                  }`}
                                >
                                  ${r}
                                </button>
                              ))}
                            </div>

                            {/* Number Input & Save */}
                            <div className="flex items-center gap-1">
                              <div className="relative w-20">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-secondary">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={currentRate}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value) || 0;
                                    setProjectRates(prev => ({ ...prev, [p.name]: v }));
                                  }}
                                  className="w-full bg-slate-50 dark:bg-[#060608] border border-black/10 dark:border-white/10 rounded-lg pl-6 pr-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#6324FC]"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSaveProjectRate(p.name, currentRate)}
                                disabled={isSavingProjectRate}
                                className="px-2.5 py-1 rounded-lg text-xs font-heading font-bold bg-[#6324FC] hover:bg-[#521bd6] text-white transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-black/5 dark:border-white/5 flex justify-end bg-black/[0.01] dark:bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setIsProjectRatesModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-heading font-bold text-xs bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
