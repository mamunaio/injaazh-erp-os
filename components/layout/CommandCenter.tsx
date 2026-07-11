'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Users, 
  Briefcase, 
  FileText, 
  DollarSign, 
  Settings,
  Mail,
  Zap,
  ArrowRight,
  Command
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const shortcuts = [
  { id: 'dashboard', name: 'Go to Dashboard', icon: Briefcase, path: '/dashboard', color: 'text-indigo-500' },
  { id: 'add-lead', name: 'Add New Lead', icon: Plus, path: '/prospects', color: 'text-teal-500' },
  { id: 'leads', name: 'View Prospects & Leads', icon: Users, path: '/prospects', color: 'text-teal-500' },
  { id: 'proposals', name: 'Create Proposal', icon: FileText, path: '/proposals', color: 'text-violet-500' },
  { id: 'outreach', name: 'Outreach Automation', icon: Zap, path: '/outreach', color: 'text-amber-500' },
  { id: 'money', name: 'Finance & Transactions', icon: DollarSign, path: '/money', color: 'text-pink-500' },
  { id: 'settings', name: 'System Settings', icon: Settings, path: '/settings', color: 'text-slate-500' },
];

// Reusable dummy plus icon
function Plus(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
}

export default function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  const filteredShortcuts = shortcuts.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh] px-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden neu-pressed"
          >
            {/* Search Input Area */}
            <div className="flex items-center px-6 py-4 border-b border-slate-200/10 dark:border-white/5">
              <Search size={24} className="text-indigo-400 mr-4" />
              <input
                ref={inputRef}
                type="text"
                placeholder="What do you want to do? (e.g., 'Add Lead')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-800/30 px-2 py-1 rounded-md ml-4">
                <span>ESC</span>
              </div>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredShortcuts.length > 0 ? (
                <div className="space-y-1">
                  {filteredShortcuts.map((shortcut, index) => {
                    const Icon = shortcut.icon;
                    return (
                      <button
                        key={shortcut.id}
                        onClick={() => handleSelect(shortcut.path)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner ${shortcut.color}`}>
                            <Icon size={20} />
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-400 transition-colors">
                            {shortcut.name}
                          </span>
                        </div>
                        <ArrowRight size={18} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-slate-500">
                  <Command size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No actions found for "{query}"</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
