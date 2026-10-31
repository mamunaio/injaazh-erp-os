'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Briefcase, DollarSign, Settings, X, Wallet, Map, Clock, Globe, Sparkles, CheckSquare, Flame, FileText, ClipboardList, TrendingUp 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from './SidebarContext';
import { useAppearance } from './AppearanceContext';
import { useUser } from './UserContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Overview' },
  { name: 'Lead Gen Engine', href: '/lead-gen/dashboard', icon: Flame, category: 'Operations' },
  { name: 'Marketplace', href: '/marketplace', icon: Globe, category: 'Marketplace' },
  { name: 'Clients', href: '/marketplace/clients', icon: Users, category: 'Marketplace' },
  { name: 'Projects', href: '/projects', icon: Briefcase, category: 'Operations' },
  { name: 'Proposals', href: '/proposals', icon: FileText, category: 'Operations' },
  { name: 'Requirements', href: '/requirements', icon: ClipboardList, category: 'Operations' },
  { name: 'SEO & Reporting', href: '/seo', icon: TrendingUp, category: 'Operations' },
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
  const isDock = mounted && sidebarLayout === 'dock';

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    
    if (user.role === 'admin') {
      if (item.href === '/daily-expenses') return false;
      return true;
    }
    
    if (user.role === 'editor') {
      const allowed = ['/dashboard', '/lead-gen', '/lead-gen/dashboard', '/marketplace', '/marketplace/clients', '/projects', '/proposals', '/requirements', '/seo', '/tasks', '/roadmap', '/timesheets', '/team-logs'];
      return allowed.includes(item.href);
    }

    if (user.role === 'marketplace_team') {
      const allowed = ['/dashboard', '/lead-gen', '/lead-gen/dashboard', '/marketplace', '/marketplace/clients', '/proposals', '/requirements', '/seo', '/tasks', '/team-logs'];
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
      
      <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} ${isDock ? 'lg:hidden' : ''} fixed top-0 bottom-0 left-0 z-50 bg-[#fafafc]/95 dark:bg-[#07080b]/95 backdrop-blur-2xl border-r border-black/5 dark:border-white/5 flex flex-col transition-all duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>
        
        {/* Logo Section */}
        <div className={`h-[72px] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-5'} border-b border-black/5 dark:border-white/5 relative`}>
          {/* Subtle top-edge shine */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setIsMobileSidebarOpen(false)}>
            {isCollapsed ? (
              <div className="w-10 h-10 rounded-xl bg-[#6324FC]/10 border border-[#6324FC]/30 flex items-center justify-center text-[#6324FC] group-hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(99,36,252,0.25)]">
                <span className="font-heading font-black text-lg bg-gradient-to-br from-[#6324FC] to-[#00E5FF] bg-clip-text text-transparent">I</span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <div className="relative h-7 w-28">
                  <Image 
                    src="/assets/logo.webp" 
                    alt="INJAAZH" 
                    fill 
                    sizes="112px"
                    unoptimized
                    className="object-contain object-left dark:brightness-0 dark:invert transition-all duration-300" 
                    priority
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" /> Business OS
                </span>
              </div>
            )}
          </Link>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 text-secondary hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 animate-pulse">
                  <div className="w-4 h-4 rounded bg-white/10" />
                  <div className="h-3 bg-white/10 rounded w-24" />
                </div>
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                {!isCollapsed && (
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500/80 uppercase tracking-[0.18em]">
                      {cat.name}
                    </span>
                  </div>
                )}
                {cat.items.map(renderNavItem)}
              </div>
            ))
          )}
        </nav>

        {/* Bottom Theme & Status */}
        <div className="p-3 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.01] flex flex-col gap-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span>OS v2.4 Active</span>
              </span>
              <span className="text-[#6324FC] dark:text-[#00E5FF] font-semibold">ERP Live</span>
            </div>
          )}
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
          : item.href === '/lead-gen/dashboard'
            ? pathname.startsWith('/lead-gen')
            : pathname.startsWith(item.href);
    
    const Icon = item.icon;

    return (
      <div key={item.name} className="space-y-0.5">
        <Link
          href={item.href}
          prefetch={false}
          title={isCollapsed ? item.name : undefined}
          onClick={() => setIsMobileSidebarOpen(false)}
          className={`group relative flex items-center justify-between ${isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-heading transition-all duration-200 ${
            isActive 
              ? 'bg-gradient-to-r from-[#6324FC]/20 via-[#6324FC]/10 to-transparent text-black dark:text-white font-bold border border-[#6324FC]/35 shadow-[0_0_20px_rgba(99,36,252,0.15)]' 
              : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.04] border border-transparent hover:border-black/5 dark:hover:border-white/5 font-medium'
          }`}
        >
          {/* Active Indicator Glowing Neon Bar */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-[#6324FC] to-[#00E5FF] rounded-r shadow-[0_0_12px_#6324FC]" />
          )}
          
          <div className="flex items-center gap-3 min-w-0">
            <Icon 
              size={isCollapsed ? 20 : 17} 
              className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-[#6324FC] dark:text-[#00E5FF]' : 'text-slate-500 group-hover:text-black dark:group-hover:text-white'
              }`} 
            />
            
            {!isCollapsed && (
              <span className="truncate tracking-wide text-xs">
                {item.name}
              </span>
            )}
          </div>
        </Link>
      </div>
    );
  }
}
