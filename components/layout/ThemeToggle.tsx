'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  // Prevent hydration mismatch
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return <div className="h-10 w-full neu-pressed rounded-xl"></div>;
  }

  return (
    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 gap-1 w-full justify-between">
      <button
        onClick={() => setTheme('light')}
        className={`w-8 h-8 flex justify-center items-center rounded-md transition-all ${
          theme === 'light' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        aria-label="Light theme"
      >
        <Sun size={14} />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`w-8 h-8 flex justify-center items-center rounded-md transition-all ${
          theme === 'system' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        aria-label="System theme"
      >
        <Laptop size={14} />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`w-8 h-8 flex justify-center items-center rounded-md transition-all ${
          theme === 'dark' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        aria-label="Dark theme"
      >
        <Moon size={14} />
      </button>
    </div>
  );
}
