'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, ChevronDown, Settings, LogOut, CheckCircle2, DollarSign, Users, Menu, Sparkles, ArrowUpRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { useRouter } from 'next/navigation';
import { getRecentNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearReadNotifications } from '@/app/actions/notificationActions';
import { logoutUser } from '@/app/actions/authActions';
import { notify } from '@/lib/notify';
import { sounds } from '@/lib/sound';
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
  const [unreadCount, setUnreadCount] = useState(0);
  const { toggleSidebar } = useSidebar();
  const { sidebarLayout } = useAppearance();
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef(-1);
  const seenNotificationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Fetch notifications from server with deterministic deduplication
    const fetchNotifs = async () => {
      try {
        const res = await getRecentNotifications();
        const list = res.notifications || [];
        const count = typeof res.unreadCount === 'number' ? res.unreadCount : list.filter((n: any) => !n.isRead).length;
        
        setNotifications(list);
        setUnreadCount(count);
        
        if (prevUnreadCountRef.current === -1) {
          // Initial mount: record existing notification IDs so page refresh never replays popups
          list.forEach((n: any) => {
            if (n._id) seenNotificationIds.current.add(n._id);
          });
        } else if (count > prevUnreadCountRef.current) {
          // Identify unread notifications that arrived from external sources and have not been alerted
          const incomingUnread = list.filter((n: any) => !n.isRead && !seenNotificationIds.current.has(n._id));

          incomingUnread.forEach((n: any) => {
            seenNotificationIds.current.add(n._id);
            // Suppress alert if already triggered locally by mutation response or instant notification
            const isEmittedLocally = notify.isRecentlyEmitted(n._id) || notify.isRecentlyEmitted(n.message);
            if (!isEmittedLocally) {
              notify.notification(`New: ${n.message}`);
            }
          });
        }

        // Keep seenNotificationIds populated
        list.forEach((n: any) => {
          if (n._id) seenNotificationIds.current.add(n._id);
        });

        prevUnreadCountRef.current = count;
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    
    fetchNotifs();
    
    const handleInstantFetch = () => fetchNotifs();
    window.addEventListener('fetch-notifications', handleInstantFetch);

    // 🚀 Instant 0ms Optimistic Notification Dispatcher
    const handleInstantNotification = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const detail = customEvent.detail;
      if (!detail || !detail.message) return;

      const optimisticItem = {
        _id: detail.id || 'opt-' + Date.now(),
        type: detail.type || 'system',
        message: detail.message,
        link: detail.link || '',
        isRead: false,
        createdAt: new Date().toISOString()
      };

      seenNotificationIds.current.add(optimisticItem._id);
      notify.markEmitted(optimisticItem._id);
      notify.markEmitted(optimisticItem.message);

      setNotifications(prev => [optimisticItem, ...prev]);
      setUnreadCount(prev => prev + 1);
      prevUnreadCountRef.current = prevUnreadCountRef.current + 1;
    };
    window.addEventListener('instant-notification', handleInstantNotification);
    
    // Snappy 15s background sync for external updates
    const interval = setInterval(fetchNotifs, 15000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('fetch-notifications', handleInstantFetch);
      window.removeEventListener('instant-notification', handleInstantNotification);
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
    sounds.pop();
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    sounds.pop();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  const handleClearRead = async () => {
    sounds.delete();
    setNotifications(prev => prev.filter(n => !n.isRead));
    await clearReadNotifications();
  };

  const handleNotificationClick = (notif: any) => {
    sounds.click();
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    if (notif.link) {
      setShowNotifications(false);
      router.push(notif.link);
    }
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

  const handleOpenCommandCenter = () => {
    window.dispatchEvent(new CustomEvent('open-command-center'));
  };

  const handleOpenAiChat = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
  };

  return (
    <header className={`h-18 fixed top-0 right-0 left-0 ${sidebarLayout === 'collapsed' ? 'lg:left-[80px]' : sidebarLayout === 'dock' ? 'lg:left-0' : 'lg:left-[260px]'} z-40 bg-slate-50/80 dark:bg-[#060608]/80 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 px-5 md:px-7 flex items-center justify-between transition-all duration-300`}>
      {/* Left Area */}
      <div className="flex items-center gap-3">
        {sidebarLayout === 'dock' ? (
          <Link href="/dashboard" className="flex items-center gap-2.5 mr-2 group">
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
            <span className="hidden sm:inline-flex text-[9px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] px-1.5 py-0.5 rounded-md bg-[#6324FC]/10 border border-[#6324FC]/20 uppercase">
              Business OS
            </span>
          </Link>
        ) : (
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* Center Search / Command Trigger */}
      <div className="hidden md:flex flex-1 max-w-xl mx-6">
        <button 
          onClick={handleOpenCommandCenter}
          className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white/60 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-black/5 dark:border-white/10 hover:border-[#6324FC]/50 text-left transition-all duration-200 group shadow-xs hover:shadow-[0_0_20px_rgba(99,36,252,0.12)]"
        >
          <div className="flex items-center gap-3">
            <Search size={14} className="text-secondary group-hover:text-[#6324FC] dark:group-hover:text-[#00E5FF] transition-colors" />
            <span className="text-xs text-secondary group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
              Search actions, projects, clients, or press <kbd className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 ml-1">⌘K</kbd>
            </span>
          </div>
          <kbd className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-secondary bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md px-1.5 py-0.5">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        
        {/* Demo Mode Badge */}
        {user?.role === 'viewer' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold tracking-tight shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Demo Mode (Read-Only)</span>
            <span className="sm:hidden">Demo</span>
          </div>
        )}

        {/* Quick AI Copilot Trigger */}
        <button
          onClick={handleOpenAiChat}
          title="Open AI Business Copilot"
          className="group relative p-[1px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-xs hover:shadow-[0_0_20px_rgba(99,36,252,0.35)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#6324FC] via-[#8B5CF6] to-[#00E5FF] opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="relative px-3 py-1.5 rounded-[11px] bg-slate-50 dark:bg-[#060608] flex items-center gap-2 text-xs font-heading font-bold text-slate-900 dark:text-white">
            <Sparkles size={13} className="text-[#6324FC] dark:text-[#00E5FF] animate-pulse" />
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
            className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
              showNotifications 
                ? 'bg-[#6324FC]/10 border-[#6324FC]/40 text-[#6324FC] dark:text-[#00E5FF] shadow-[0_0_15px_rgba(99,36,252,0.2)]' 
                : 'bg-white/60 dark:bg-white/[0.03] border-black/5 dark:border-white/10 text-secondary hover:text-slate-900 dark:hover:text-white hover:border-black/15 dark:hover:border-white/20'
            }`}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6324FC] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]" />
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
                className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-96 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl"
              >
                <div className="px-5 py-3.5 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6324FC]/15 text-[#6324FC] dark:text-[#00E5FF] border border-[#6324FC]/30">
                        {unreadCount} NEW
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-heading font-bold text-[#6324FC] dark:text-[#00E5FF] hover:underline transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[380px] overflow-y-auto divide-y divide-black/5 dark:divide-white/5 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Bell className="mx-auto mb-2 opacity-30 text-slate-400" size={24} />
                      <p className="text-xs">No notifications found</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-start gap-3 cursor-pointer group ${!notif.isRead ? 'bg-[#6324FC]/[0.06] dark:bg-[#6324FC]/[0.08]' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                          notif.type === 'payment' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          notif.type === 'lead' ? 'border-[#6324FC]/30 bg-[#6324FC]/10 text-[#6324FC] dark:text-[#00E5FF]' :
                          'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                        }`}>
                          {notif.type === 'payment' ? <DollarSign size={14} /> : notif.type === 'lead' ? <Users size={14} /> : <CheckCircle2 size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${!notif.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              {getRelativeTime(notif.createdAt)}
                            </span>
                            {notif.link && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#6324FC] dark:text-[#00E5FF] group-hover:underline">
                                <span>View</span>
                                <ArrowUpRight size={10} />
                              </span>
                            )}
                          </div>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#6324FC] dark:bg-[#00E5FF] shrink-0 mt-1.5 shadow-[0_0_8px_#6324FC]" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Controls */}
                {notifications.some(n => n.isRead) && (
                  <div className="px-4 py-2.5 border-t border-black/5 dark:border-white/10 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-[10px] font-mono text-slate-400">
                      Showing recent {notifications.length}
                    </span>
                    <button
                      onClick={handleClearRead}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>Clear read</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div className="relative pl-1" ref={profileRef}>
          <button 
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6324FC]/30 to-[#00E5FF]/20 border border-[#6324FC]/40 p-[2px] shadow-sm relative">
              <div className="w-full h-full rounded-[8px] bg-[#060608] flex items-center justify-center overflow-hidden">
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
              <p className="text-xs font-heading font-extrabold text-slate-900 dark:text-white leading-tight">{user?.name || 'Mamun'}</p>
              <p className="text-[10px] font-mono font-bold text-[#6324FC] dark:text-[#00E5FF] uppercase tracking-wider">
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
                className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#0a0a0d] border border-black/10 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden z-50 p-2 backdrop-blur-2xl"
              >
                <div className="px-3 py-2.5 mb-1 border-b border-black/5 dark:border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6324FC]/30 to-[#00E5FF]/20 border border-[#6324FC]/40 p-[1.5px] shrink-0">
                    <div className="w-full h-full rounded-[8px] bg-[#060608] flex items-center justify-center overflow-hidden">
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
                    <p className="text-xs font-heading font-extrabold text-slate-900 dark:text-white truncate">{user?.name || 'Mamun'}</p>
                    <p className="text-[11px] text-secondary truncate">{user?.email || ''}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button onClick={() => { setShowProfile(false); router.push('/settings'); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs font-heading font-semibold">
                    <Settings size={14} className="text-secondary" />
                    System Settings
                  </button>
                </div>

                <div className="mt-1 pt-1 border-t border-black/5 dark:border-white/10">
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-xs font-heading font-semibold">
                    <LogOut size={14} />
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
