'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[104px] h-9 bg-slate-100 dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-full animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/10 rounded-full shadow-sm">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition-all duration-200 ${
          theme === 'light' 
            ? 'bg-[#6324FC]/15 text-[#6324FC] shadow-xs' 
            : 'text-secondary hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-full transition-all duration-200 ${
          theme === 'system' 
            ? 'bg-[#6324FC]/15 text-[#6324FC] dark:text-[#00E5FF] shadow-xs' 
            : 'text-secondary hover:text-slate-900 dark:hover:text-white'
        }`}
        title="System Preference"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition-all duration-200 ${
          theme === 'dark' 
            ? 'bg-[#6324FC]/25 text-[#00E5FF] shadow-[0_0_10px_rgba(99,36,252,0.4)]' 
            : 'text-secondary hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
