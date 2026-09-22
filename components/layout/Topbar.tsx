'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Settings, LogOut, CheckCircle2, DollarSign, Users, Menu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { getRecentNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notificationActions';
import { logoutUser } from '@/app/actions/authActions';
import { notify } from '@/lib/notify';
import { useSidebar } from './SidebarContext';
import { useUser } from './UserContext';
import { useAppearance } from './AppearanceContext';

// Helper to format relative time (e.g., "2m ago")
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

export default function Topbar() {
  const { user } = useUser();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { toggleSidebar } = useSidebar();
  const { sidebarLayout } = useAppearance();
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef(0);

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifs = async () => {
      const data = await getRecentNotifications();
      setNotifications(data);
      
      const currentUnread = data.filter((n: any) => !n.isRead).length;
      if (currentUnread > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
        const newNotifs = data.filter((n: any) => !n.isRead);
        if (newNotifs.length > 0) {
          const newest = newNotifs[0];
          notify.success(`New Notification: ${newest.message}`);
        }
      }
      prevUnreadCountRef.current = currentUnread;
    };
    
    fetchNotifs();
    
    const handleInstantFetch = () => fetchNotifs();
    window.addEventListener('fetch-notifications', handleInstantFetch);
    
    const interval = setInterval(fetchNotifs, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('fetch-notifications', handleInstantFetch);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleSignOut = async () => {
    setShowProfile(false);
    const result = await logoutUser();
    if (result.success) {
      notify.success('Signed out successfully');
      router.push('/login');
    } else {
      notify.error('Failed to sign out');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenCommandCenter = () => {
    window.dispatchEvent(new CustomEvent('open-command-center'));
  };

  const handleOpenAiChat = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
  };

  return (
    <header className={`h-20 fixed top-0 right-0 left-0 ${sidebarLayout === 'collapsed' ? 'lg:left-[80px]' : 'lg:left-[260px]'} z-40 bg-[#f5f5f0]/80 dark:bg-[#060608]/80 backdrop-blur-xl border-b border-primary/10 px-6 flex items-center justify-between transition-all duration-300`}>
      {/* Left Area */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-secondary hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Center Search / Command Trigger */}
      <div className="hidden md:flex flex-1 max-w-xl mx-6">
        <button 
          onClick={handleOpenCommandCenter}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-primary/[0.03] hover:bg-primary/[0.06] border border-primary/10 hover:border-[#6324FC]/30 text-left transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <Search size={16} className="text-secondary group-hover:text-[#6324FC] transition-colors" />
            <span className="text-xs font-sans text-secondary group-hover:text-primary transition-colors">
              Search actions, tasks, invoices, or press <kbd className="text-[10px] font-heading font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/15 ml-1">⌘K</kbd>
            </span>
          </div>
          <kbd className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-secondary bg-primary/5 border border-primary/10 rounded px-2 py-0.5">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        
        {/* Quick AI Copilot Trigger */}
        <button
          onClick={handleOpenAiChat}
          title="Open AI Business Copilot"
          className="group relative p-[1px] rounded-lg overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 hover:shadow-[0_0_20px_rgba(99,36,252,0.3)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#6324FC] to-[#00E5FF] opacity-60 group-hover:opacity-100 transition-opacity" />
          <div className="relative px-3 py-1.5 rounded-[7px] bg-[#f5f5f0] dark:bg-[#060608] flex items-center gap-2 text-xs font-heading font-semibold text-primary">
            <Sparkles size={13} className="text-[#6324FC] animate-pulse" />
            <span className="hidden sm:inline">AI Copilot</span>
          </div>
        </button>

        {/* Notifications */}
        <div 
          className="relative" 
          ref={notifRef}
        >
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className={`relative p-2.5 rounded-lg border transition-all duration-300 ${
              showNotifications 
                ? 'bg-[#6324FC]/10 border-[#6324FC]/30 text-[#6324FC]' 
                : 'bg-primary/5 border-primary/10 text-secondary hover:text-primary hover:border-primary/20'
            }`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6324FC] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6324FC]" />
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-88 bg-surface border border-primary/15 rounded-lg shadow-2xl overflow-hidden z-50 backdrop-blur-2xl"
              >
                <div className="px-5 py-3.5 border-b border-primary/10 flex justify-between items-center bg-primary/[0.02]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-sm text-primary">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-heading font-bold bg-[#6324FC]/10 text-[#6324FC] border border-[#6324FC]/20">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-heading font-bold text-[#6324FC] hover:underline transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto divide-y divide-primary/5 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-secondary">
                      <Bell className="mx-auto mb-2 opacity-30" size={24} />
                      <p className="text-sm font-sans">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                        className={`p-4 hover:bg-primary/5 transition-colors flex gap-3.5 ${!notif.isRead ? 'bg-[#6324FC]/[0.03] cursor-pointer' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          notif.type === 'payment' ? 'bg-emerald-500/10 text-emerald-500' :
                          notif.type === 'lead' ? 'bg-[#6324FC]/10 text-[#6324FC]' :
                          'bg-primary/5 text-secondary'
                        }`}>
                          {notif.type === 'payment' ? <DollarSign size={15} /> : notif.type === 'lead' ? <Users size={15} /> : <CheckCircle2 size={15} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${!notif.isRead ? 'font-bold text-primary' : 'font-medium text-secondary'}`}>
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-secondary/70 mt-1">
                            {getRelativeTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div className="relative pl-1" ref={profileRef}>
          <button 
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-[#6324FC]/20 border border-[#6324FC]/40 p-[2px] shadow-sm relative">
              <div className="w-full h-full rounded-[6px] bg-[#060608] flex items-center justify-center overflow-hidden">
                <Image 
                  src={user?.image || `/assets/mamun.ceo.webp`} 
                  alt="User Avatar" 
                  width={36}
                  height={36}
                  className="w-full h-full object-cover" 
                  unoptimized
                />
              </div>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-heading font-bold text-primary leading-tight">{user?.name || 'Mamun'}</p>
              <p className="text-[10px] font-heading font-semibold text-[#6324FC] uppercase tracking-wider">
                {user?.role === 'owner' ? 'Founder / CEO' : user?.role === 'admin' ? 'Admin' : user?.role === 'editor' ? 'Editor' : 'Team Member'}
              </p>
            </div>
            <ChevronDown size={14} className={`text-secondary transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-64 bg-surface border border-primary/15 rounded-lg shadow-2xl overflow-hidden z-50 p-2 backdrop-blur-2xl"
              >
                <div className="px-3 py-2.5 mb-1 border-b border-primary/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#6324FC]/20 border border-[#6324FC]/40 p-[1.5px] shrink-0">
                    <div className="w-full h-full rounded-[6px] bg-[#060608] flex items-center justify-center overflow-hidden">
                      <Image 
                        src={user?.image || `/assets/mamun.ceo.webp`} 
                        alt="User Avatar" 
                        width={40}
                        height={40}
                        className="w-full h-full object-cover" 
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-heading font-bold text-primary truncate">{user?.name || 'Mamun'}</p>
                    <p className="text-xs font-sans text-secondary truncate">{user?.email || ''}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button onClick={() => { setShowProfile(false); router.push('/settings'); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-primary hover:bg-primary/5 transition-colors text-xs font-heading font-semibold">
                    <Settings size={15} className="text-secondary" />
                    System Settings
                  </button>
                </div>

                <div className="mt-1 pt-1 border-t border-primary/10">
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors text-xs font-heading font-semibold">
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
