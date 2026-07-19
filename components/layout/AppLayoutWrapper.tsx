'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { AppearanceProvider, useAppearance } from '@/components/layout/AppearanceContext';
import { UserProvider } from '@/components/layout/UserContext';
import { ConfirmDialogProvider } from '@/components/layout/ConfirmDialogProvider';
import { logoutUser } from '@/app/actions/authActions';

export default function AppLayoutWrapper({ children, initialUser }: { children: React.ReactNode, initialUser?: any }) {
  const pathname = usePathname();
  const isAuthPage = 
    pathname === '/' ||
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/forgot-password' || 
    pathname.startsWith('/reset-password');

  const isProposalPublicPage = pathname.startsWith('/p/');

  React.useEffect(() => {
    // If not auth page, not public page, and initialUser is null (session invalid in DB),
    // force clear the cookie so middleware catches it properly.
    if (!isAuthPage && !isProposalPublicPage && !initialUser) {
      logoutUser().then(() => {
        window.location.href = '/login';
      });
    }
  }, [isAuthPage, isProposalPublicPage, initialUser]);

  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B]">{children}</main>;
  }

  if (isProposalPublicPage) {
    return <main className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B]">{children}</main>;
  }

  return (
    <AppearanceProvider>
      <UserProvider initialUser={initialUser}>
        <ConfirmDialogProvider>
          <SidebarProvider>
            <AppContent children={children} initialUser={initialUser} />
          </SidebarProvider>
        </ConfirmDialogProvider>
      </UserProvider>
    </AppearanceProvider>
  );
}

function AppContent({ children, initialUser }: { children: React.ReactNode, initialUser?: any }) {
  const { sidebarLayout } = useAppearance();
  
  return (
    <>
      <Sidebar />
      <Topbar />
      <main className={`pt-[100px] pr-4 pb-4 min-h-screen transition-all duration-300 relative ${sidebarLayout === 'collapsed' ? 'pl-4 lg:pl-[88px]' : 'pl-4 lg:pl-[288px]'}`}>
        {children}
      </main>
    </>
  );
}
