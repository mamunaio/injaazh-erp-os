'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Briefcase, DollarSign, Settings, X, Wallet, Map, Clock, Globe, Sparkles, CheckSquare 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from './SidebarContext';
import { useAppearance } from './AppearanceContext';
import { useUser } from './UserContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Overview' },
  { name: 'Marketplace', href: '/marketplace', icon: Globe, category: 'Marketplace' },
  { name: 'Clients', href: '/marketplace/clients', icon: Users, category: 'Marketplace' },
  { name: 'Projects', href: '/projects', icon: Briefcase, category: 'Operations' },
  { name: 'Work Log & Tasks', href: '/tasks', icon: CheckSquare, category: 'Operations' },
  { name: 'Roadmap', href: '/roadmap', icon: Map, category: 'Operations' },
  { name: 'Timesheets', href: '/timesheets', icon: Clock, category: 'Operations' },
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
      const allowed = ['/dashboard', '/marketplace', '/marketplace/clients', '/projects', '/tasks', '/roadmap', '/timesheets', '/team-logs'];
      return allowed.includes(item.href);
    }

    if (user.role === 'marketplace_team') {
      const allowed = ['/dashboard', '/marketplace', '/marketplace/clients', '/tasks', '/team-logs'];
      return allowed.includes(item.href);
    }
    
    return false;
  });

  const categories = [
    { name: 'Overview', items: filteredNavItems.filter(i => i.category === 'Overview') },
    { name: 'Marketplace', items: filteredNavItems.filter(i => i.category === 'Marketplace') },
    { name: 'Operations', items: filteredNavItems.filter(i => i.category === 'Operations') },
    { name: 'Finance', items: filteredNavItems.filter(i => i.category === 'Finance') },
    { name: 'System', items: filteredNavItems.filter(i => i.category === 'System') },
  ].filter(cat => cat.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} fixed top-0 bottom-0 left-0 z-50 bg-[#f5f5f0]/95 dark:bg-[#060608]/95 backdrop-blur-2xl border-r border-primary/10 flex flex-col transition-all duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>
        
        {/* Logo Section */}
        <div className={`h-[72px] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-5'} border-b border-primary/10`}>
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setIsMobileSidebarOpen(false)}>
            {isCollapsed ? (
              <div className="w-10 h-10 rounded-lg bg-[#6324FC]/10 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] group-hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(99,36,252,0.2)]">
                <span className="font-heading font-bold text-lg text-[#6324FC]">I</span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <div className="relative h-7 w-28">
                  <Image 
                    src="/assets/logo.webp" 
                    alt="INJAAZH" 
                    fill 
                    className="object-contain object-left dark:brightness-0 dark:invert transition-all duration-300" 
                    priority
                  />
                </div>
                <span className="text-[10px] font-heading font-semibold text-[#6324FC] tracking-wider uppercase flex items-center gap-1">
                  <Sparkles size={10} /> Business OS
                </span>
              </div>
            )}
          </Link>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 text-secondary hover:text-primary rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 animate-pulse">
                  <div className="w-4 h-4 rounded bg-primary/10" />
                  <div className="h-3 bg-primary/10 rounded w-24" />
                </div>
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                {!isCollapsed && (
                  <div className="flex items-center justify-between px-3 pt-2 pb-1">
                    <span className="text-[11px] font-heading font-bold text-secondary/70 uppercase tracking-widest">
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
        <div className="p-3 border-t border-primary/10 bg-primary/[0.02] flex flex-col gap-2">
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
        className={`group relative flex items-center ${isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm font-sans font-medium transition-all duration-300 ${
          isActive 
            ? 'bg-[#6324FC]/10 text-[#6324FC] dark:text-[#edeae2] font-semibold border border-[#6324FC]/20 shadow-[0_0_15px_rgba(99,36,252,0.1)]' 
            : 'text-secondary hover:text-primary hover:bg-primary/5 hover:border-primary/5'
        }`}
      >
        {/* Active Indicator Bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#6324FC] rounded-r shadow-[0_0_10px_rgba(99,36,252,0.8)]" />
        )}
        
        <Icon 
          size={isCollapsed ? 20 : 18} 
          className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
            isActive ? 'text-[#6324FC]' : 'text-secondary group-hover:text-primary'
          }`} 
        />
        
        {!isCollapsed && (
          <span className="truncate font-heading tracking-wide">
            {item.name}
          </span>
        )}
      </Link>
    );
  }
}
