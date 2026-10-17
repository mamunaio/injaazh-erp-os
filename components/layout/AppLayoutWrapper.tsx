'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import AppleDock from '@/components/layout/AppleDock';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { AppearanceProvider, useAppearance } from '@/components/layout/AppearanceContext';
import { UserProvider } from '@/components/layout/UserContext';
import { ConfirmDialogProvider } from '@/components/layout/ConfirmDialogProvider';
import { logoutUser } from '@/app/actions/authActions';

import { motion } from 'framer-motion';

export default function AppLayoutWrapper({ children, initialUser }: { children: React.ReactNode, initialUser?: any }) {
  const pathname = usePathname();
  const isAuthPage = 
    pathname === '/' ||
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/forgot-password' || 
    pathname.startsWith('/reset-password');

  React.useEffect(() => {
    // If not auth page and initialUser is null (session invalid in DB),
    // force clear the cookie so middleware catches it properly.
    if (!isAuthPage && !initialUser) {
      logoutUser().then(() => {
        window.location.href = '/login';
      });
    }
  }, [isAuthPage, initialUser]);

  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B]">{children}</main>;
  }

  return (
    <AppearanceProvider>
      <UserProvider initialUser={initialUser}>
        <ConfirmDialogProvider>
          <SidebarProvider>
            <AppContent initialUser={initialUser}>
              {children}
            </AppContent>
          </SidebarProvider>
        </ConfirmDialogProvider>
      </UserProvider>
    </AppearanceProvider>
  );
}

function AppContent({ children, initialUser }: { children: React.ReactNode, initialUser?: any }) {
  const { sidebarLayout, mounted } = useAppearance();
  const isDock = mounted && sidebarLayout === 'dock';
  const pathname = usePathname();
  
  return (
    <>
      <Sidebar />
      <Topbar />
      <main className={`pt-[100px] pr-4 transition-all duration-300 relative ${
        isDock 
          ? 'pl-4 lg:pl-6 pb-28 max-w-[1600px] mx-auto' 
          : sidebarLayout === 'collapsed' 
            ? 'pl-4 lg:pl-[88px] pb-6' 
            : 'pl-4 lg:pl-[288px] pb-6'
      }`}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          {children}
        </motion.div>
      </main>
      {isDock && <AppleDock />}
    </>
  );
}
