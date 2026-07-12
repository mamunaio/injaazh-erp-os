'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[104px] h-9 neu-flat bg-white dark:bg-[#11131A] rounded-full animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-1 p-1 neu-flat bg-white dark:bg-[#11131A] rounded-full backdrop-blur-md">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'system' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
