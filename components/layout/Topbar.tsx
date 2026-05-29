'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, User, Settings, LogOut, CheckCircle2, DollarSign, Users, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getRecentNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notificationActions';
import { useSidebar } from './SidebarContext';

export default function Topbar() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { toggleSidebar } = useSidebar();
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifs = async () => {
      const data = await getRecentNotifications();
      setNotifications(data);
    };
    fetchNotifs();
    
    // Set up an interval to poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-64 z-40 bg-white/50 dark:bg-purple-950/10 backdrop-blur-3xl border-b border-slate-200/50 dark:border-white/10 px-4 md:px-8 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/10 rounded-lg"
        >
          <Menu size={24} />
        </button>
        {/* Search */}
        <div className="hidden md:block relative group w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400 dark:text-gray-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-white transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200/50 dark:border-white/5 rounded-xl leading-5 bg-white/50 dark:bg-white/5 text-slate-800 dark:text-gray-300 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white/80 dark:focus:bg-white/10 focus:border-indigo-500/50 dark:focus:border-white/20 focus:ring-1 focus:ring-indigo-500/50 dark:focus:ring-white/20 transition-all sm:text-sm backdrop-blur-md"
            placeholder="Search leads, projects, proposals..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-slate-400 dark:text-gray-500 text-xs border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 bg-white dark:bg-black/50 shadow-sm dark:shadow-none">⌘K</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6 ml-4">
        
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
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
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50"
              >
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">Mark all read</button>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                      <Bell className="mx-auto mb-2 opacity-50" size={24} />
                      <p className="text-sm font-medium">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                        className={`p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-4 ${!notif.isRead ? 'bg-indigo-50/30 dark:bg-indigo-500/5 cursor-pointer' : ''}`}
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
                          <p className="text-xs font-medium text-slate-400 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 text-center bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
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
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent" alt="User Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Mamun</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">Agency Owner</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 dark:text-gray-500 transition-all duration-300 ${showProfile ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'group-hover:text-indigo-600 dark:group-hover:text-white'}`} />
          </div>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-4 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 p-2"
              >
                <div className="px-4 py-3 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent" alt="User Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Mamun</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-32">admin@injaazh.com</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button onClick={() => { setShowProfile(false); router.push('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white text-sm font-medium group">
                    <Settings size={16} className="text-slate-400 group-hover:text-indigo-500" />
                    Account Settings
                  </button>
                  <button onClick={() => { setShowProfile(false); router.push('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white text-sm font-medium group">
                    <User size={16} className="text-slate-400 group-hover:text-indigo-500" />
                    My Profile
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-sm font-medium group">
                    <LogOut size={16} className="text-slate-400 group-hover:text-rose-500" />
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
