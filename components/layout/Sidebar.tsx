'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Briefcase, Store, DollarSign, Settings, Globe } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Marketplace', href: '/marketplace', icon: Store },
  { name: 'Market Clients', href: '/marketplace/clients', icon: Users },
  { name: 'Money', href: '/money', icon: DollarSign },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 fixed inset-y-0 left-0 z-50 bg-white/50 dark:bg-purple-950/10 backdrop-blur-3xl border-r border-slate-200/50 dark:border-white/10 flex flex-col transition-all duration-300 shadow-[2px_0_10px_rgba(0,0,0,0.05)] dark:shadow-none">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200/50 dark:border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-white dark:to-gray-500 flex items-center justify-center shadow-lg dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
            <Globe className="text-white dark:text-black" size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-400">
            Injaazh Global
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">
          Menu
        </div>
        {navItems.map((item) => {
          // Determine active state for both exact match and sub-routes (except dashboard)
          const isActive = item.href === '/dashboard' 
            ? pathname === '/' || pathname === '/dashboard'
            : item.href === '/marketplace'
              ? pathname === '/marketplace' || (pathname.startsWith('/marketplace/') && !pathname.startsWith('/marketplace/clients'))
              : pathname.startsWith(item.href);
          
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'text-indigo-600 bg-indigo-500/10 dark:text-white dark:bg-white/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-5 bg-indigo-600 dark:bg-white rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              )}
              <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-500 group-hover:text-indigo-500 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors'} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings at Bottom */}
      <div className="p-4 border-t border-slate-200/50 dark:border-white/5 space-y-4">
        <ThemeToggle />
        
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
            pathname.startsWith('/settings')
              ? 'text-indigo-600 bg-indigo-500/10 dark:text-white dark:bg-white/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
          }`}
        >
          <Settings size={18} className="text-slate-500 group-hover:text-indigo-500 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
          <span className="font-medium text-sm">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
