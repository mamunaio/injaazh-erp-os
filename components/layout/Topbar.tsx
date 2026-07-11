'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, User, Settings, LogOut, CheckCircle2, DollarSign, Users, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getRecentNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notificationActions';
import { logoutUser } from '@/app/actions/authActions';
import toast from 'react-hot-toast';
import { useSidebar } from './SidebarContext';
import { useUser } from './UserContext';

// Helper to play a soft, realistic notification 'ding' using Web Audio API
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Slide to A6
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

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
        playNotificationSound();
        
        // Show Toast Popup
        const newNotifs = data.filter((n: any) => !n.isRead);
        if (newNotifs.length > 0) {
          const newest = newNotifs[0];
          toast.custom((t) => (
             <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full neu-flat rounded-2xl pointer-events-auto flex`}>
               <div className="flex-1 w-0 p-4">
                 <div className="flex items-start">
                   <div className="flex-shrink-0 pt-0.5">
                     <div className="h-10 w-10 rounded-full neu-pressed flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                       <Bell size={18} />
                     </div>
                   </div>
                   <div className="ml-3 flex-1">
                     <p className="text-sm font-bold text-slate-800 dark:text-white">
                       New Notification
                     </p>
                     <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                       {newest.message}
                     </p>
                   </div>
                 </div>
               </div>
               <div className="flex border-l border-slate-300 dark:border-slate-800/50">
                 <button
                   onClick={() => toast.dismiss(t.id)}
                   className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                 >
                   Close
                 </button>
               </div>
             </div>
          ), { duration: 5000 });
        }
      }
      prevUnreadCountRef.current = currentUnread;
    };
    
    fetchNotifs();
    
    // Listen for custom event to trigger instant fetch
    const handleInstantFetch = () => fetchNotifs();
    window.addEventListener('fetch-notifications', handleInstantFetch);
    
    // Polling every 10 seconds as backup
    const interval = setInterval(fetchNotifs, 10000);
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
      toast.success('Signed out successfully');
      router.push('/login');
    } else {
      toast.error('Failed to sign out');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-20 fixed top-0 right-0 left-0 lg:left-[260px] z-40 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-6 flex items-center justify-between transition-all duration-300">
      {/* Left Area */}
      <div className="flex-1 flex items-center justify-start">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/10 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Center Area (Search) */}
      <div className="hidden md:flex flex-[2] justify-center px-4">
        <div className="relative group w-full max-w-lg">
          {/* Animated glow background on focus */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-0 group-focus-within:opacity-25 blur-md transition-opacity duration-500"></div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-500 dark:text-slate-400 dark:text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-purple-400 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-12 py-2 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-lg leading-5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all sm:text-sm"
              placeholder="Search leads, companies, emails..."
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-gray-500 border border-slate-200 dark:border-white/10 rounded-md px-1.5 py-0.5 bg-slate-100 dark:bg-white/5">⌘K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex-1 flex items-center justify-end gap-4 md:gap-6">
        
        {/* Notifications */}
        <div 
          className="relative" 
          ref={notifRef}
          onMouseEnter={() => { setShowNotifications(true); setShowProfile(false); }}
        >
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className={`relative p-2 rounded-xl transition-colors ${showNotifications ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0a0a0a]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-5 py-4 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Mark all read</button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500">
                      <Bell className="mx-auto mb-2 opacity-50" size={24} />
                      <p className="text-sm font-medium">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                        className={`p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex gap-4 ${!notif.isRead ? 'cursor-pointer' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notif.type === 'payment' ? 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' :
                          notif.type === 'lead' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {notif.type === 'payment' ? <DollarSign size={18} /> : notif.type === 'lead' ? <Users size={18} /> : <CheckCircle2 size={18} />}
                        </div>
                        <div>
                          <p className={`text-sm ${!notif.isRead ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-medium text-slate-600 dark:text-slate-400'}`}>{notif.message}</p>
                          <p className={`text-xs mt-1 flex items-center gap-1.5 ${!notif.isRead ? 'font-bold text-indigo-500' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                            {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 block"></span>}
                            {getRelativeTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 text-center border-t border-slate-200 dark:border-slate-800/50">
                  <button className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">View All Activity</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div className="relative border-l border-slate-200/50 dark:border-white/10 pl-6" ref={profileRef}>
          <div 
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] shadow-sm">
              <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center overflow-hidden">
                <img src={user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'Felix'}&backgroundColor=transparent`} alt="User Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user?.name || 'Loading...'}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                {user?.role === 'owner' ? 'Owner' : user?.role === 'admin' ? 'Admin' : user?.role === 'editor' ? 'Editor' : user?.role === 'marketplace_team' ? 'Marketplace Team' : 'User'}
              </p>
            </div>
            <ChevronDown size={14} className={`text-slate-500 dark:text-slate-400 dark:text-gray-500 transition-all duration-300 ${showProfile ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'group-hover:text-indigo-600 dark:group-hover:text-slate-900 dark:hover:text-white'}`} />
          </div>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-4 w-60 bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
              >
                <div className="px-4 py-3 mb-2 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center overflow-hidden">
                      <img src={user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'Felix'}&backgroundColor=transparent`} alt="User Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{user?.name || 'Loading...'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-32">{user?.email || ''}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button onClick={() => { setShowProfile(false); router.push('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-sm font-medium group">
                    <Settings size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-900 dark:hover:text-white" />
                    Account Settings
                  </button>
                  <button onClick={() => { setShowProfile(false); router.push('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-sm font-medium group">
                    <User size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-900 dark:hover:text-white" />
                    My Profile
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-white/5 transition-all text-slate-700 hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-500 text-sm font-medium group">
                    <LogOut size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-rose-500" />
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
