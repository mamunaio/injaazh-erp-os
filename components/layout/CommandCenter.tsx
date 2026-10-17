'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Users, 
  Briefcase, 
  DollarSign, 
  Settings, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  Command, 
  PlusCircle, 
  Wallet, 
  Clock, 
  Map, 
  Activity,
  Layers,
  Bot,
  Globe,
  Flame
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandItem {
  id: string;
  name: string;
  category: 'Actions' | 'Navigation' | 'AI & Tools';
  icon: any;
  path?: string;
  action?: () => void;
  color: string;
}

export default function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands: CommandItem[] = [
    // Quick Actions
    { id: 'act-project', name: 'Start New Project', category: 'Actions', icon: Briefcase, path: '/projects?action=new', color: 'text-blue-500 bg-blue-500/10' },
    { id: 'act-expense', name: 'Log Daily Expense', category: 'Actions', icon: Wallet, path: '/daily-expenses?action=new', color: 'text-rose-500 bg-rose-500/10' },

    // Navigation
    { id: 'nav-dashboard', name: 'Go to Dashboard & Insights', category: 'Navigation', icon: Layers, path: '/dashboard', color: 'text-cyan-500 bg-cyan-500/10' },
    { id: 'nav-lead-gen', name: 'Lead Gen Engine (Main)', category: 'Navigation', icon: Flame, path: '/lead-gen/dashboard', color: 'text-amber-500 bg-amber-500/10' },
    { id: 'nav-lead-gen-prospects', name: 'Lead Gen: HVAC Prospects Pipeline', category: 'Navigation', icon: Users, path: '/lead-gen/prospects', color: 'text-amber-500 bg-amber-500/10' },
    { id: 'nav-lead-gen-daily', name: 'Lead Gen: Daily Outreach Logs', category: 'Navigation', icon: Mail, path: '/lead-gen/daily-outreach', color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'nav-lead-gen-clients', name: 'Lead Gen: Retainer Clients & MRR', category: 'Navigation', icon: Briefcase, path: '/lead-gen/clients', color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'nav-lead-gen-time', name: 'Lead Gen: Time Tracking & Hours', category: 'Navigation', icon: Clock, path: '/lead-gen/time-tracking', color: 'text-blue-500 bg-blue-500/10' },
    { id: 'nav-lead-gen-tasks', name: 'Lead Gen: Team Tasks & Delegation', category: 'Navigation', icon: Activity, path: '/lead-gen/team-tasks', color: 'text-purple-500 bg-purple-500/10' },
    { id: 'nav-lead-gen-sops', name: 'Lead Gen: Delivery SOPs & Cadence', category: 'Navigation', icon: Map, path: '/lead-gen/delivery-sops', color: 'text-teal-500 bg-teal-500/10' },
    { id: 'nav-lead-gen-finance', name: 'Lead Gen: Financials, Invoices & PnL', category: 'Navigation', icon: DollarSign, path: '/lead-gen/financials', color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'nav-lead-gen-settings', name: 'Lead Gen: Settings & SOP Guide', category: 'Navigation', icon: Settings, path: '/lead-gen/settings', color: 'text-slate-400 bg-slate-500/10' },
    { id: 'nav-marketplace', name: 'Marketplace Operations', category: 'Navigation', icon: Globe, path: '/marketplace', color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'nav-clients', name: 'Marketplace Clients', category: 'Navigation', icon: Users, path: '/marketplace/clients', color: 'text-purple-500 bg-purple-500/10' },
    { id: 'nav-projects', name: 'Projects Kanban Board', category: 'Navigation', icon: Briefcase, path: '/projects', color: 'text-blue-500 bg-blue-500/10' },
    { id: 'nav-roadmap', name: 'Milestone Roadmap', category: 'Navigation', icon: Map, path: '/roadmap', color: 'text-amber-500 bg-amber-500/10' },
    { id: 'nav-timesheets', name: 'Timesheets & Work Logs', category: 'Navigation', icon: Clock, path: '/timesheets', color: 'text-orange-500 bg-orange-500/10' },
    { id: 'nav-finance', name: 'Finance & Bank Ledger', category: 'Navigation', icon: DollarSign, path: '/finance', color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'nav-expenses', name: 'Daily Expenses & Debts', category: 'Navigation', icon: Wallet, path: '/daily-expenses', color: 'text-rose-500 bg-rose-500/10' },
    { id: 'nav-settings', name: 'System Settings & AI Keys', category: 'Navigation', icon: Settings, path: '/settings', color: 'text-slate-400 bg-slate-500/10' },

    // AI & Tools
    { id: 'ai-chat', name: 'Open AI Business Copilot', category: 'AI & Tools', icon: Bot, action: () => {
      window.dispatchEvent(new CustomEvent('open-ai-chat'));
    }, color: 'text-primary-500 bg-primary-500/10' },
  ];

  const filtered = allCommands.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

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

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-center', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-center', handleCustomOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.path) {
      router.push(item.path);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[12vh] px-4 bg-black/75 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#0d0f17] border border-black/10 dark:border-white/15 rounded-2xl shadow-[0_20px_50px_-10px_rgba(15,23,42,0.15),0_0_30px_rgba(99,36,252,0.1)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(99,36,252,0.15)] overflow-hidden backdrop-blur-2xl"
          >
            {/* Search Input */}
            <div className="flex items-center px-5 py-3.5 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
              <Search size={18} className="text-[#6324FC] dark:text-[#00E5FF] mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search (e.g. 'Marketplace', 'Projects', 'Finance')..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full bg-transparent text-sm font-sans text-black dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 px-2 py-0.5 rounded-md">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filtered.length > 0 ? (
                filtered.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 group text-left ${
                        isSelected 
                          ? 'bg-[#6324FC]/15 text-[#6324FC] dark:text-white font-bold border border-[#6324FC]/40 shadow-[0_0_15px_rgba(99,36,252,0.15)]' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-xs font-heading font-bold truncate text-black dark:text-white">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <ArrowRight 
                        size={14} 
                        className={`text-[#6324FC] dark:text-[#00E5FF] transition-transform duration-200 ${
                          isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                        }`} 
                      />
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <Command size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-sans">No results found for "{query}"</p>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-5 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-3">
                <span>Use <kbd className="font-bold text-black dark:text-white px-1 rounded bg-black/5 dark:bg-white/10">↑↓</kbd> to navigate</span>
                <span><kbd className="font-bold text-black dark:text-white px-1 rounded bg-black/5 dark:bg-white/10">↵</kbd> to select</span>
              </div>
              <span className="font-bold text-[#6324FC] dark:text-[#00E5FF]">Injaazh Command Hub</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
