'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LayoutDashboard, Users, FileText, Briefcase, Store, DollarSign, Settings, Globe, Activity, X, Wallet, Mail, Map } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from './SidebarContext';
import { useUser } from './UserContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Email Outreach', href: '/outreach', icon: Mail },
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Marketplace', href: '/marketplace', icon: Store },
  { name: 'Market Clients', href: '/marketplace/clients', icon: Users },
  { name: 'Money', href: '/money', icon: DollarSign },
  { name: 'Daily Expenses', href: '/daily-expenses', icon: Wallet },
  { name: 'SEO & AEO Tracker', href: '/seo', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSidebar();
  const { user } = useUser();

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    if (item.href === '/dashboard') return true;
    if (item.href === '/leads' && user.permissions?.includes('leads')) return true;
    if (item.href === '/outreach' && user.permissions?.includes('outreach')) return true;
    
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
      
      <aside className={`w-64 fixed inset-y-0 left-0 z-50 bg-white/95 dark:bg-[#0B0E1A]/95 backdrop-blur-2xl border-r border-slate-200/50 dark:border-white/5 flex flex-col transition-transform duration-300 shadow-[2px_0_10px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_20px_rgba(0,0,0,0.5)] ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-white/5 bg-gradient-to-r from-transparent to-transparent dark:from-indigo-500/5 dark:to-purple-500/5">
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsMobileSidebarOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/50 group-hover:shadow-indigo-500/50 dark:group-hover:shadow-indigo-500/70 transition-all duration-300 group-hover:scale-105">
              <Globe className="text-white" size={20} />
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
        {filteredNavItems.map((item) => {
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/50' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              {/* Glow effect for active tab */}
              {isActive && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-100 blur-sm" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                </>
              )}
              
              <Icon size={20} className={`relative z-10 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-500 group-hover:text-indigo-500 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors'}`} />
              <span className={`relative z-10 font-semibold text-sm ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}`}>{item.name}</span>
              
              {/* Hover glow effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300 rounded-xl" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings at Bottom */}
      <div className="p-4 border-t border-slate-200/50 dark:border-white/5 space-y-3 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-transparent">
        <ThemeToggle />
        
        <Link
          href="/settings"
          onClick={() => setIsMobileSidebarOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
            pathname.startsWith('/settings')
              ? 'text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/50'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
          }`}
        >
          {pathname.startsWith('/settings') && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-100 blur-sm" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            </>
          )}
          <Settings size={20} className={`relative z-10 ${pathname.startsWith('/settings') ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-500 group-hover:text-indigo-500 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors'}`} />
          <span className={`relative z-10 font-semibold text-sm ${pathname.startsWith('/settings') ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}`}>Settings</span>
          
          {!pathname.startsWith('/settings') && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300 rounded-xl" />
          )}
        </Link>
      </div>
    </aside>
    </>
  );
}
