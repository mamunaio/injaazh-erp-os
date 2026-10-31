'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  color?: string;
  badge?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  labelPrefix?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
  triggerClassName?: string;
  minWidth?: number;
  disabled?: boolean;
  align?: 'left' | 'right' | 'auto';
  id?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  labelPrefix,
  placeholder = 'Select option',
  size = 'md',
  className = '',
  triggerClassName = '',
  minWidth = 160,
  disabled = false,
  align = 'auto',
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find((o) => o.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update dropdown position relative to viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(options.length * 40 + 20, 280);
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

    if (align === 'right' || (align === 'auto' && left + targetWidth > viewportWidth - 12)) {
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
  }, [minWidth, options.length, align]);

  // Position listener on scroll and resize
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
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition, highlightedIndex, onChange, options]);

  // Sync highlighted index when opened
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  const SelectedIcon = selectedOpt?.icon;

  return (
    <div className={`relative inline-block ${className}`} id={id}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex items-center justify-between gap-2 rounded-xl border transition-all outline-none select-none text-left ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/5'
            : isOpen
            ? 'border-[#6324FC] dark:border-[#6324FC] shadow-[0_0_0_2px_rgba(99,36,252,0.18)] bg-white dark:bg-[#0c0d14]'
            : 'border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#060608] hover:border-[#6324FC]/50 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#0c0d14]'
        } ${
          size === 'sm'
            ? 'px-2.5 py-1.5 text-xs'
            : 'px-3.5 py-2.5 text-xs'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOpt?.color && (
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-xs"
              style={{
                backgroundColor: selectedOpt.color,
                boxShadow: `0 0 6px ${selectedOpt.color}`,
              }}
            />
          )}
          {SelectedIcon && (
            <SelectedIcon size={14} className="shrink-0 text-slate-500" />
          )}
          {labelPrefix && (
            <span className="text-slate-400 font-normal shrink-0">{labelPrefix}:</span>
          )}
          <span className="font-heading font-bold text-slate-800 dark:text-slate-100 truncate">
            {selectedOpt ? selectedOpt.label : placeholder}
          </span>
          {selectedOpt?.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-black/5 dark:bg-white/10 text-slate-500 shrink-0">
              {selectedOpt.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#6324FC]' : 'group-hover:text-slate-600 dark:group-hover:text-slate-200'
          }`}
        />
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            tabIndex={-1}
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : 'auto',
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 999999,
            }}
            className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0c0d14] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden"
          >
            {labelPrefix && (
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-black/5 dark:border-white/5 mb-1 flex items-center justify-between">
                <span>Select {labelPrefix}</span>
                <span className="text-[9px] text-slate-400">Esc to close</span>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                const OptIcon = opt.icon;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-heading transition-colors text-left ${
                      isSelected
                        ? 'bg-[#6324FC]/10 dark:bg-[#6324FC]/20 text-[#6324FC] dark:text-[#a782fc] font-bold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-medium'
                        : 'text-slate-700 dark:text-slate-300 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {opt.color && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                          style={{
                            backgroundColor: opt.color,
                            boxShadow: isSelected ? `0 0 8px ${opt.color}` : undefined,
                          }}
                        />
                      )}
                      {OptIcon && (
                        <OptIcon size={14} className="shrink-0 opacity-70" />
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-black/5 dark:bg-white/10 text-slate-500 shrink-0">
                          {opt.badge}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check size={14} className="shrink-0 text-[#6324FC] dark:text-[#a782fc]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

