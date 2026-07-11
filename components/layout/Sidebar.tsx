'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LayoutDashboard, Users, FileText, Briefcase, Store, DollarSign, Settings, Globe, Activity, X, Wallet, Mail, Map, Clock, BookOpen, Hexagon } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from './SidebarContext';
import { useUser } from './UserContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Prospects', href: '/prospects', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Outreach', href: '/outreach', icon: Activity },
  { name: 'Deals', href: '/deals', icon: Hexagon }, // As per image
  { name: 'Proposals', href: '/proposals', icon: FileText },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Clients', href: '/marketplace/clients', icon: Users },
  { name: 'Finance', href: '/money', icon: DollarSign },
  { name: 'Expenses', href: '/daily-expenses', icon: Wallet },
  { name: 'Insights', href: '/settings/insights', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
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
      const allowed = ['/dashboard', '/prospects', '/outreach', '/proposals', '/projects', '/roadmap', '/team-logs'];
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
      
      <aside className={`w-[260px] fixed top-0 bottom-0 left-0 z-50 bg-[#0A0A0B] border-r border-white/5 flex flex-col transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-[72px] flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsMobileSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-500 transition-all duration-300 group-hover:scale-105">
              <Hexagon size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">
              Injaazh Global
            </span>
          </Link>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:text-white rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {loading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                  <div className="w-4 h-4 rounded-md bg-white/5 animate-pulse"></div>
                  <div className="h-3.5 bg-white/5 rounded w-24 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Grouping based on the image: HOME, LEADS, SALES, WORK, FINANCE, SYSTEM */}
              
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 mb-2 px-3">Home</div>
              {filteredNavItems.filter(i => ['/dashboard'].includes(i.href)).map(renderNavItem)}

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-3">Leads</div>
              {filteredNavItems.filter(i => ['/prospects', '/campaigns', '/outreach'].includes(i.href)).map(renderNavItem)}

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-3">Sales</div>
              {filteredNavItems.filter(i => ['/deals', '/proposals', '/marketplace/clients'].includes(i.href)).map(renderNavItem)}

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-3">Work</div>
              {filteredNavItems.filter(i => ['/projects', '/roadmap'].includes(i.href)).map(renderNavItem)}

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-3">Finance</div>
              {filteredNavItems.filter(i => ['/money', '/daily-expenses'].includes(i.href)).map(renderNavItem)}

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-3">System</div>
              {filteredNavItems.filter(i => ['/settings/insights', '/settings'].includes(i.href)).map(renderNavItem)}
            </>
          )}
        </nav>

        {/* User Profile at Bottom */}
        <div className="p-4 border-t border-white/5 space-y-3 mt-auto">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <img src={user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'Felix'}&backgroundColor=transparent`} className="w-8 h-8 rounded-full border border-white/10" />
               <div className="flex flex-col">
                 <span className="text-sm font-semibold text-white">{user?.name || 'User'}</span>
                 <span className="text-[10px] text-slate-400 capitalize">{user?.role || 'Guest'}</span>
               </div>
             </div>
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
        : pathname.startsWith(item.href);
    
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => setIsMobileSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
        <span className={`font-medium text-sm`}>{item.name}</span>
      </Link>
    );
  }
}
