'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LayoutDashboard, Users, FileText, Briefcase, Store, DollarSign, Settings, Globe, Activity, X, Wallet, Mail, Map, Clock, BookOpen } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from './SidebarContext';
import { useUser } from './UserContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Outreach Analytics', href: '/outreach', icon: Mail },
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Marketplace', href: '/marketplace', icon: Store },
  { name: 'Market Clients', href: '/marketplace/clients', icon: Users },
  { name: 'Money', href: '/money', icon: DollarSign },
  { name: 'Daily Expenses', href: '/daily-expenses', icon: Wallet },
  { name: 'Team Logs', href: '/team-logs', icon: Clock },
  { name: 'Islamic Insights', href: '/settings/insights', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSidebar();
  const { user, loading } = useUser();

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    
    if (user.role === 'admin') {
      if (item.href === '/daily-expenses' || item.href === '/settings/insights') return false;
      return true;
    }
    
    if (user.role === 'editor') {
      const allowed = ['/dashboard', '/leads', '/outreach', '/proposals', '/projects', '/roadmap', '/team-logs'];
      return allowed.includes(item.href);
    }

    if (user.role === 'marketplace_team') {
      const allowed = ['/dashboard', '/marketplace', '/marketplace/clients', '/team-logs'];
      return allowed.includes(item.href);
    }
    
    return false;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      <aside className={`w-64 fixed top-[45px] bottom-4 left-4 z-50 neu-flat flex flex-col transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50 bg-transparent">
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsMobileSidebarOpen(false)}>
            <div className="w-9 h-9 rounded-xl neu-pressed flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:neu-button">
              <Globe className="text-indigo-500" size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300">
              Injaazh Global
            </span>
          </Link>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-4 px-3">
          Navigation
        </div>
        
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl">
                <div className="w-5 h-5 rounded-md bg-slate-200/50 dark:bg-slate-800/50 animate-pulse"></div>
                <div className="h-4 bg-slate-200/50 dark:bg-slate-800/50 rounded w-28 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          filteredNavItems.map((item) => {
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
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'neu-button text-indigo-500 font-bold' 
                    : 'text-slate-500 hover:neu-flat'
                }`}
              >
                <Icon size={20} className={`${isActive ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-500 transition-colors'}`} />
                <span className={`font-semibold text-sm`}>{item.name}</span>
              </Link>
            );
          })
        )}
      </nav>

      {/* Settings at Bottom */}
      <div className="p-4 border-t border-slate-800/50 space-y-3 mt-auto">
        <ThemeToggle />
        
        <Link
          href="/settings"
          onClick={() => setIsMobileSidebarOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
            pathname.startsWith('/settings')
              ? 'neu-button text-indigo-500 font-bold'
              : 'text-slate-500 hover:neu-flat'
          }`}
        >
          <Settings size={20} className={`${pathname.startsWith('/settings') ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-500 transition-colors'}`} />
          <span className={`font-semibold text-sm`}>Settings</span>
        </Link>
      </div>
    </aside>
    </>
  );
}
