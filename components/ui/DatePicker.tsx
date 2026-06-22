'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  name?: string;
}

export default function DatePicker({ value, onChange, className = '', placeholder = 'Select Date', name }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or default to today
  const selectedDate = value ? new Date(value) : new Date();
  
  // View state
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDateSelect = (day: number) => {
    // Format YYYY-MM-DD
    const yy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${yy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const renderDays = () => {
    const days = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = value && currentYear === selectedDate.getFullYear() && currentMonth === selectedDate.getMonth() && i === selectedDate.getDate();
      const isToday = new Date().getFullYear() === currentYear && new Date().getMonth() === currentMonth && new Date().getDate() === i;

      days.push(
        <button
          key={`day-${i}`}
          onClick={(e) => { e.preventDefault(); handleDateSelect(i); }}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
            ${isSelected 
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105' 
              : isToday
                ? 'bg-indigo-500/10 text-indigo-500 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }
          `}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  // Formatted display value
  const displayValue = value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {name && <input type="hidden" name={name} value={value} />}
      {/* Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 neu-pressed rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent text-slate-700 dark:text-slate-200 font-bold text-left"
      >
        <CalendarIcon size={18} className="text-slate-400" />
        <span>{displayValue}</span>
      </button>

      {/* Calendar Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-3xl shadow-2xl z-50 w-[300px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); handlePrevMonth(); }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="font-bold text-slate-800 dark:text-slate-100">
                {monthNames[currentMonth]} {currentYear}
              </div>
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); handleNextMonth(); }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 place-items-center">
              {renderDays()}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/5 flex justify-between">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const today = new Date();
                  const yy = today.getFullYear();
                  const mm = String(today.getMonth() + 1).padStart(2, '0');
                  const dd = String(today.getDate()).padStart(2, '0');
                  onChange(`${yy}-${mm}-${dd}`);
                  setIsOpen(false);
                }}
                className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors px-2 py-1"
              >
                Today
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-500 transition-colors px-2 py-1"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
