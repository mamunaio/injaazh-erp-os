'use client';

import React, { useState } from 'react';
import { Search, List, LayoutGrid, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeadsFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  totalLeads: number;
}

const STATUS_OPTIONS = ['All', 'New', 'Queued', 'Email Sent', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'];
const SOURCE_OPTIONS = ['All Sources', 'Apollo', 'LinkedIn', 'Google', 'Referral', 'Manual', 'Other'];
const DATE_OPTIONS   = ['Any Time', 'Today', 'Last 7 Days', 'Last 30 Days', 'Last 3 Months'];

interface FilterDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

function FilterDropdown({ label, options, value, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const isActive = options[0] !== value;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
          isActive
            ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30'
            : 'bg-white dark:bg-[#11131A] text-[#94A3B8] border-slate-200 dark:border-[#232734] hover:text-slate-900 dark:hover:text-white hover:border-slate-200 dark:border-[#232734]'
        }`}
      >
        {isActive ? value : label}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 z-40 min-w-[160px] bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                    value === opt
                      ? 'text-[#2563EB] bg-[#2563EB]/10'
                      : 'text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:bg-[#232734]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LeadsFilters({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  totalLeads,
}: LeadsFiltersProps) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All Sources');
  const [dateFilter, setDateFilter]     = useState('Any Time');

  const activeFilterCount = [
    statusFilter !== 'All',
    sourceFilter !== 'All Sources',
    dateFilter !== 'Any Time',
  ].filter(Boolean).length;

  const clearAll = () => {
    setStatusFilter('All');
    setSourceFilter('All Sources');
    setDateFilter('Any Time');
    setSearchQuery('');
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Row 1: Search + View Toggle */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md group">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search prospects, emails, domains…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] text-slate-900 dark:text-white placeholder-[#94A3B8]/60 text-sm font-medium rounded-xl pl-11 pr-10 py-2.5 focus:outline-none focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-200 dark:bg-[#232734] flex items-center justify-center text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1 hidden md:block" />

        {/* Results count */}
        <div className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl">
          <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{totalLeads}</span>
          <span className="text-xs font-semibold text-[#94A3B8]">prospects</span>
        </div>

        {/* View Mode */}
        <div className="flex items-center bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`relative p-2 rounded-lg transition-colors z-10 ${
              viewMode === 'list' ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8] hover:text-[#94A3B8]/80'
            }`}
            aria-label="List view"
          >
            {viewMode === 'list' && (
              <motion.div layoutId="viewModeIndicator" className="absolute inset-0 bg-slate-200 dark:bg-[#232734] rounded-lg -z-10 border border-slate-200 dark:border-white/5" />
            )}
            <List size={15} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`relative p-2 rounded-lg transition-colors z-10 ${
              viewMode === 'grid' ? 'text-slate-900 dark:text-white' : 'text-[#94A3B8] hover:text-[#94A3B8]/80'
            }`}
            aria-label="Grid view"
          >
            {viewMode === 'grid' && (
              <motion.div layoutId="viewModeIndicator" className="absolute inset-0 bg-slate-200 dark:bg-[#232734] rounded-lg -z-10 border border-slate-200 dark:border-white/5" />
            )}
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {/* Row 2: Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#94A3B8]">
          <SlidersHorizontal size={13} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#2563EB] text-slate-900 dark:text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="w-px h-4 bg-slate-200 dark:bg-[#232734]" />

        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterDropdown
          label="Source"
          options={SOURCE_OPTIONS}
          value={sourceFilter}
          onChange={setSourceFilter}
        />
        <FilterDropdown
          label="Date Added"
          options={DATE_OPTIONS}
          value={dateFilter}
          onChange={setDateFilter}
        />

        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#94A3B8] hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-200 dark:bg-[#232734] border border-transparent hover:border-slate-200 dark:border-[#232734] transition-all"
          >
            <X size={11} /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}
