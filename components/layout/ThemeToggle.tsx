'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  // Prevent hydration mismatch
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return <div className="h-10 w-full bg-slate-200/10 dark:bg-slate-800/20 rounded-xl animate-pulse"></div>;
  }

  return (
    <div className="flex bg-slate-200/50 dark:bg-purple-950/30 p-1 rounded-xl backdrop-blur-md border border-slate-300/50 dark:border-purple-500/20 shadow-inner">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-all relative ${
          theme === 'light' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {theme === 'light' && (
          <motion.div 
            layoutId="theme-bubble"
            className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Sun size={16} className="relative z-10" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-all relative ${
          theme === 'system' ? 'text-purple-600 dark:text-purple-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
        }`}
      >
        {theme === 'system' && (
          <motion.div 
            layoutId="theme-bubble"
            className="absolute inset-0 bg-white dark:bg-purple-500/20 rounded-lg shadow-sm border border-slate-200 dark:border-purple-500/30"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Laptop size={16} className="relative z-10" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-all relative ${
          theme === 'dark' ? 'text-purple-300' : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        {theme === 'dark' && (
          <motion.div 
            layoutId="theme-bubble"
            className="absolute inset-0 bg-purple-500/20 rounded-lg shadow-sm border border-purple-500/30"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Moon size={16} className="relative z-10" />
      </button>
    </div>
  );
}
