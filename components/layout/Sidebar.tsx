'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, FileText, Briefcase, DollarSign, Settings, Activity, X, Wallet, Mail, Map, Clock, Hexagon, Sparkles 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from './SidebarContext';
import { useAppearance } from './AppearanceContext';
import { useUser } from './UserContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Home' },
  { name: 'Prospects', href: '/prospects', icon: Users, category: 'Leads' },
  { name: 'Campaigns', href: '/campaigns', icon: Mail, category: 'Leads' },
  { name: 'Outreach', href: '/outreach', icon: Activity, category: 'Leads' },
  { name: 'Proposals', href: '/proposals', icon: FileText, category: 'Sales' },
  { name: 'Clients', href: '/marketplace/clients', icon: Users, category: 'Sales' },
  { name: 'Projects', href: '/projects', icon: Briefcase, category: 'Work' },
  { name: 'Roadmap', href: '/roadmap', icon: Map, category: 'Work' },
  { name: 'Timesheets', href: '/timesheets', icon: Clock, category: 'Work' },
  { name: 'Finance', href: '/finance', icon: DollarSign, category: 'Finance' },
  { name: 'Expenses', href: '/daily-expenses', icon: Wallet, category: 'Finance' },
  { name: 'Settings', href: '/settings', icon: Settings, category: 'System' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSidebar();
  const { sidebarLayout, mounted } = useAppearance();
  const { user, loading } = useUser();
  const isCollapsed = mounted && sidebarLayout === 'collapsed';

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    
    if (user.role === 'admin') {
      if (item.href === '/daily-expenses') return false;
      return true;
    }
    
    if (user.role === 'editor') {
      const allowed = ['/dashboard', '/prospects', '/outreach', '/proposals', '/projects', '/roadmap', '/timesheets', '/team-logs'];
      return allowed.includes(item.href);
    }

    if (user.role === 'marketplace_team') {
      const allowed = ['/dashboard', '/marketplace', '/marketplace/clients', '/team-logs'];
      return allowed.includes(item.href);
    }
    
    return false;
  });

  const categories = [
    { name: 'Home', items: filteredNavItems.filter(i => i.category === 'Home') },
    { name: 'Leads', items: filteredNavItems.filter(i => i.category === 'Leads') },
    { name: 'Sales', items: filteredNavItems.filter(i => i.category === 'Sales') },
    { name: 'Work', items: filteredNavItems.filter(i => i.category === 'Work') },
    { name: 'Finance', items: filteredNavItems.filter(i => i.category === 'Finance') },
    { name: 'System', items: filteredNavItems.filter(i => i.category === 'System') },
  ].filter(cat => cat.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      <aside className={`${isCollapsed ? 'w-[84px]' : 'w-[260px]'} fixed top-0 bottom-0 left-0 z-50 bg-white/90 dark:bg-[#07080B]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/5 flex flex-col transition-all duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>
        
        {/* Logo Section */}
        <div className={`h-[72px] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-5'} border-b border-slate-200/50 dark:border-white/[0.04]`}>
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setIsMobileSidebarOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
              <Hexagon size={20} fill="currentColor" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[15px] tracking-tight text-slate-900 dark:text-white leading-tight">
                  Injaazh ERP
                </span>
                <span className="text-[10px] font-semibold text-primary-500 tracking-wider uppercase flex items-center gap-1">
                  <Sparkles size={10} /> AI Operating OS
                </span>
              </div>
            )}
          </Link>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse">
                  <div className="w-4 h-4 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-24" />
                </div>
              ))}
            </div>
          ) : (
            categories.map((cat, idx) => (
              <div key={cat.name} className="space-y-1">
                {!isCollapsed && (
                  <div className="flex items-center justify-between px-3 pt-1 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {cat.name}
                    </span>
                  </div>
                )}
                {cat.items.map(renderNavItem)}
              </div>
            ))
          )}
        </nav>

        {/* Bottom Theme & User Info */}
        <div className="p-3 border-t border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-black/20 flex flex-col gap-2">
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );

  function renderNavItem(item: any) {
    const isActive = item.href === '/dashboard' 
      ? pathname === '/' || pathname === '/dashboard'
      : item.href === '/marketplace'
        ? pathname === '/marketplace' || (pathname.startsWith('/marketplace/') && !pathname.startsWith('/marketplace/clients'))
        : item.href === '/settings'
          ? pathname === '/settings' || pathname.startsWith('/settings/')
          : pathname.startsWith(item.href);
    
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        href={item.href}
        title={isCollapsed ? item.name : undefined}
        onClick={() => setIsMobileSidebarOpen(false)}
        className={`group relative flex items-center ${isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400 font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.04]'
        }`}
      >
        {/* Active Pill Indicator */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-500 rounded-r-full shadow-[0_0_8px_rgba(var(--color-primary-500),0.8)]" />
        )}
        
        <Icon 
          size={isCollapsed ? 20 : 18} 
          className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
            isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
          }`} 
        />
        
        {!isCollapsed && (
          <span className="truncate">
            {item.name}
          </span>
        )}
      </Link>
    );
  }
}
