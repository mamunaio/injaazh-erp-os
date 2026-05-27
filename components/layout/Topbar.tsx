'use client';

import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-16 fixed top-0 right-0 left-64 z-40 bg-white/50 dark:bg-purple-950/10 backdrop-blur-3xl border-b border-slate-200/50 dark:border-white/10 px-8 flex items-center justify-between transition-all duration-300">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400 dark:text-gray-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-white transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200/50 dark:border-white/5 rounded-xl leading-5 bg-white/50 dark:bg-white/5 text-slate-800 dark:text-gray-300 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white/80 dark:focus:bg-white/10 focus:border-indigo-500/50 dark:focus:border-white/20 focus:ring-1 focus:ring-indigo-500/50 dark:focus:ring-white/20 transition-all sm:text-sm backdrop-blur-md"
            placeholder="Search leads, projects, proposals..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-slate-400 dark:text-gray-500 text-xs border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 bg-white dark:bg-black/50 shadow-sm dark:shadow-none">⌘K</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6 ml-4">
        <button className="relative text-slate-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 dark:bg-blue-500 ring-2 ring-white dark:ring-[#0a0a0a]" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer group pl-6 border-l border-slate-200/50 dark:border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent" alt="User Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-gray-200 transition-colors">Mamun</p>
            <p className="text-xs text-slate-500 dark:text-gray-500 group-hover:text-slate-700 dark:group-hover:text-gray-400 transition-colors">Agency Owner</p>
          </div>
          <ChevronDown size={14} className="text-slate-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors" />
        </div>
      </div>
    </header>
  );
}
