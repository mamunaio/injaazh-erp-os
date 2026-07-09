'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { UserProvider } from '@/components/layout/UserContext';
import { ConfirmDialogProvider } from '@/components/layout/ConfirmDialogProvider';
import { logoutUser } from '@/app/actions/authActions';

export default function AppLayoutWrapper({ children, initialUser }: { children: React.ReactNode, initialUser?: any }) {
  const pathname = usePathname();
  const isAuthPage = 
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
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  if (isProposalPublicPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <UserProvider initialUser={initialUser}>
      <ConfirmDialogProvider>
        <SidebarProvider>
          {/* Global Ambient Glows */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 blur-[120px] rounded-full" />
            <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-violet-500/5 blur-[150px] rounded-full" />
          </div>

          <Sidebar />
          <Topbar />
          <main className="pl-4 lg:pl-[288px] pt-[133px] pr-4 pb-4 min-h-screen transition-all duration-300 relative z-0">
            {children}
          </main>
        </SidebarProvider>
      </ConfirmDialogProvider>
    </UserProvider>
  );
}
