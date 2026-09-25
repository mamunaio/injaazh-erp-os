'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  name?: string;
  icon?: 'calendar' | 'clock';
  color?: string; // Brand accent color e.g. '#00E5FF', '#6324FC', '#10B981'
  align?: 'left' | 'right' | 'auto';
  direction?: 'up' | 'down' | 'auto';
}

export default function DatePicker({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Select Date', 
  name,
  icon = 'calendar',
  color = '#6324FC',
  align = 'auto',
  direction = 'auto'
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popupStyles, setPopupStyles] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    placement: 'top' | 'bottom';
  }>({ left: 0, placement: 'bottom' });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse current value or default to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  
  // View state
  const [currentMonth, setCurrentMonth] = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear());

  // Synchronize calendar view with selected value when opened
  useEffect(() => {
    if (isOpen) {
      if (selectedDate) {
        setCurrentMonth(selectedDate.getMonth());
        setCurrentYear(selectedDate.getFullYear());
      } else {
        const today = new Date();
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
      }
    }
  }, [isOpen, value]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate coordinates & smart placement (Drop-up vs Drop-down)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const calendarWidth = 285;
    const calendarHeight = 295;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: 'top' | 'bottom' = 'bottom';
    if (direction === 'up') {
      placement = 'top';
    } else if (direction === 'down') {
      placement = 'bottom';
    } else {
      // Auto: if not enough space below (< calendarHeight) and space above is bigger, open UPWARDS
      if (spaceBelow < calendarHeight && spaceAbove > spaceBelow) {
        placement = 'top';
      } else if (spaceBelow < 280 && spaceAbove > 280) {
        placement = 'top';
      } else {
        placement = 'bottom';
      }
    }

    // Horizontal placement calculation
    let left = rect.left;
    if (align === 'right') {
      left = rect.right - calendarWidth;
    } else if (align === 'auto') {
      if (rect.left + calendarWidth > viewportWidth - 16 || rect.left > viewportWidth / 2) {
        left = rect.right - calendarWidth;
      }
    }

    // Clamp horizontally to stay inside viewport with margin
    left = Math.max(12, Math.min(left, viewportWidth - calendarWidth - 12));

    if (placement === 'top') {
      setPopupStyles({
        bottom: viewportHeight - rect.top + 8,
        left,
        placement: 'top',
      });
    } else {
      setPopupStyles({
        top: rect.bottom + 8,
        left,
        placement: 'bottom',
      });
    }
  }, [align, direction]);

  // Position listener on open, resize, or scroll
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (popupRef.current && popupRef.current.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDateSelect = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const yy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${yy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const renderDays = () => {
    const days = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    // Days of the month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = selectedDate && 
        selectedDate.getFullYear() === currentYear && 
        selectedDate.getMonth() === currentMonth && 
        selectedDate.getDate() === i;

      const isToday = 
        today.getFullYear() === currentYear && 
        today.getMonth() === currentMonth && 
        today.getDate() === i;

      days.push(
        <button
          key={`day-${i}`}
          type="button"
          onClick={(e) => handleDateSelect(i, e)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-semibold transition-all duration-150 relative ${
            isSelected 
              ? 'bg-[#6324FC] text-white shadow-[0_0_12px_rgba(99,36,252,0.8)] font-bold scale-105 z-10' 
              : isToday
                ? 'border border-[#00E5FF]/60 text-[#00E5FF] font-bold hover:bg-[#00E5FF]/15'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
          }`}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  // Formatted display value
  const displayValue = selectedDate 
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : placeholder;

  const IconComponent = icon === 'clock' ? Clock : CalendarIcon;

  return (
    <div className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}

      {/* Input Trigger Box */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-[#07080b] border transition-all duration-200 text-xs text-left group ${
          isOpen 
            ? 'border-[#6324FC] dark:border-[#6324FC] shadow-[0_0_15px_rgba(99,36,252,0.3)]' 
            : 'border-black/10 dark:border-white/10 hover:border-[#6324FC]/40'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <IconComponent 
            size={14} 
            className="shrink-0 transition-colors" 
            style={{ color: value ? color : '#94A3B8' }} 
          />
          <span className={`font-mono truncate ${value ? 'text-black dark:text-white font-medium' : 'text-slate-400'}`}>
            {displayValue}
          </span>
        </div>

        <CalendarIcon size={13} className="text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors shrink-0 ml-1.5 opacity-60" />
      </button>

      {/* Luxury Dropdown Calendar Popup - Rendered via React Portal */}
      {mounted && isOpen && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popupRef}
              initial={{ 
                opacity: 0, 
                y: popupStyles.placement === 'top' ? 8 : -8, 
                scale: 0.96 
              }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1 
              }}
              exit={{ 
                opacity: 0, 
                y: popupStyles.placement === 'top' ? 8 : -8, 
                scale: 0.96 
              }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              style={{
                position: 'fixed',
                top: popupStyles.top !== undefined ? `${popupStyles.top}px` : 'auto',
                bottom: popupStyles.bottom !== undefined ? `${popupStyles.bottom}px` : 'auto',
                left: `${popupStyles.left}px`,
                zIndex: 99999,
              }}
              className="p-3.5 sm:p-4 bg-white dark:bg-[#0d0f17] border border-black/10 dark:border-white/15 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_25px_rgba(99,36,252,0.2)] w-[285px] max-w-[calc(100vw-24px)] backdrop-blur-3xl select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top / Bottom Accent Gradient Line */}
              <div 
                className={`absolute left-0 right-0 h-[2px] ${
                  popupStyles.placement === 'top' ? 'bottom-0' : 'top-0'
                }`}
                style={{ 
                  backgroundImage: `linear-gradient(to right, transparent, ${color}, transparent)`,
                  boxShadow: `0 0 12px ${color}`
                }}
              />

              {/* Calendar Month & Year Navigation Header */}
              <div className="flex items-center justify-between mb-3 px-1 pt-1">
                <button 
                  type="button" 
                  onClick={handlePrevMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white transition-all"
                  title="Previous Month"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="font-heading font-extrabold text-xs text-black dark:text-white tracking-wide flex items-center gap-1.5">
                  <span>{monthNames[currentMonth]}</span>
                  <span className="text-slate-400 font-mono">{currentYear}</span>
                </div>

                <button 
                  type="button" 
                  onClick={handleNextMonth}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white transition-all"
                  title="Next Month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Matrix */}
              <div className="grid grid-cols-7 gap-1 place-items-center">
                {renderDays()}
              </div>
              
              {/* Quick Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center gap-2">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const today = new Date();
                    const yy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    onChange(`${yy}-${mm}-${dd}`);
                    setIsOpen(false);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-[#6324FC]/15 hover:bg-[#6324FC]/25 border border-[#6324FC]/40 text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <Sparkles size={11} /> Today
                </button>

                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-rose-500/20 text-xs font-heading font-bold text-slate-400 hover:text-rose-500 transition-all"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
