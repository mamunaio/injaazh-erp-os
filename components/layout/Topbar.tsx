'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, User, Settings, LogOut, CheckCircle2, DollarSign, Users, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      // Play sound and show toast if there are new unread notifications compared to last check
      if (currentUnread > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
        // Show Toast Popup using global system
        const newNotifs = data.filter((n: any) => !n.isRead);
        if (newNotifs.length > 0) {
          const newest = newNotifs[0];
          notify.success(`New Notification: ${newest.message}`);
        }
      }
      prevUnreadCountRef.current = currentUnread;
    };
    
    fetchNotifs();
    
    // Listen for custom event to trigger instant fetch
    const handleInstantFetch = () => fetchNotifs();
    window.addEventListener('fetch-notifications', handleInstantFetch);
    
    // Polling every 1 minute to prevent dev server sluggishness
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
    <header className={`h-20 fixed top-0 right-0 left-0 ${sidebarLayout === 'collapsed' ? 'lg:left-[84px]' : 'lg:left-[260px]'} z-40 bg-white/70 dark:bg-[#07080B]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.04] px-6 flex items-center justify-between transition-all duration-300`}>
      {/* Left Area */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 rounded-xl transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Center Search / Command Trigger */}
      <div className="hidden md:flex flex-1 max-w-xl mx-6">
        <button 
          onClick={handleOpenCommandCenter}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08] hover:border-primary-500/50 dark:hover:border-primary-500/40 text-left transition-all duration-200 shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <Search size={17} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
            <span className="text-sm text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors font-medium">
              Search actions, leads, projects or navigate...
            </span>
          </div>
          <kbd className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-0.5 shadow-sm">
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
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary-500/10 to-indigo-500/10 hover:from-primary-500/20 hover:to-indigo-500/20 border border-primary-500/20 text-primary-600 dark:text-primary-400 font-semibold text-xs transition-all duration-200"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notifications */}
        <div 
          className="relative" 
          ref={notifRef}
        >
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
              showNotifications 
                ? 'bg-primary-500/10 border-primary-500/30 text-primary-600 dark:text-primary-400' 
                : 'bg-slate-100/80 dark:bg-white/[0.04] border-slate-200/60 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-88 bg-white dark:bg-[#0E1017] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04] custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell className="mx-auto mb-2 opacity-30" size={24} />
                      <p className="text-sm font-medium">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors flex gap-3.5 ${!notif.isRead ? 'bg-primary-500/[0.03] cursor-pointer' : ''}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          notif.type === 'payment' ? 'bg-emerald-500/10 text-emerald-500' :
                          notif.type === 'lead' ? 'bg-purple-500/10 text-purple-500' :
                          'bg-slate-100 dark:bg-white/5 text-slate-500'
                        }`}>
                          {notif.type === 'payment' ? <DollarSign size={16} /> : notif.type === 'lead' ? <Users size={16} /> : <CheckCircle2 size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${!notif.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                            {notif.message}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
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
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 p-[2px] shadow-sm">
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center overflow-hidden">
                <img src={user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'Felix'}&backgroundColor=transparent`} alt="User Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-[10px] font-semibold text-primary-500 uppercase tracking-wider">
                {user?.role === 'owner' ? 'Owner' : user?.role === 'admin' ? 'Admin' : user?.role === 'editor' ? 'Editor' : 'Team'}
              </p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#0E1017] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
              >
                <div className="px-3 py-2.5 mb-1 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 p-[1.5px] shrink-0">
                    <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center overflow-hidden">
                      <img src={user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'Felix'}&backgroundColor=transparent`} alt="User Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button onClick={() => { setShowProfile(false); router.push('/settings'); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs font-semibold">
                    <Settings size={15} className="text-slate-400" />
                    System Settings
                  </button>
                </div>

                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-xs font-semibold">
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
