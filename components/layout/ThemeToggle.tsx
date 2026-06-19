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
    <div className="flex neu-pressed p-1 rounded-xl">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-all ${
          theme === 'light' ? 'neu-button text-indigo-500' : 'text-slate-500 hover:neu-flat'
        }`}
      >
        <Sun size={16} />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-all ${
          theme === 'system' ? 'neu-button text-purple-500' : 'text-slate-500 hover:neu-flat'
        }`}
      >
        <Laptop size={16} />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-all ${
          theme === 'dark' ? 'neu-button text-purple-500' : 'text-slate-500 hover:neu-flat'
        }`}
      >
        <Moon size={16} />
      </button>
    </div>
  );
}
