'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { UserProvider } from '@/components/layout/UserContext';
import { ConfirmDialogProvider } from '@/components/layout/ConfirmDialogProvider';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/forgot-password' || 
    pathname.startsWith('/reset-password');

  const isProposalPublicPage = pathname.startsWith('/p/');

  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  if (isProposalPublicPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <UserProvider>
      <ConfirmDialogProvider>
        <SidebarProvider>
          <Sidebar />
          <Topbar />
          <main className="pl-4 lg:pl-[288px] pt-[104px] pr-4 pb-4 min-h-screen transition-all duration-300">
            {children}
          </main>
        </SidebarProvider>
      </ConfirmDialogProvider>
    </UserProvider>
  );
}
