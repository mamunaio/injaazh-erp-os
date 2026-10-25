'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DashboardView from '@/components/leadGen/DashboardView';
import { useLeadGen } from '../LeadGenContext';
import { Loader2 } from 'lucide-react';

export default function DashboardSubPage() {
  const { data, openEditLead } = useLeadGen();
  const router = useRouter();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
      </div>
    );
  }

  const handleNavigateTab = (tab: string) => {
    const routeMap: Record<string, string> = {
      'dashboard': '/lead-gen/dashboard',
      'prospects': '/lead-gen/prospects',
      'daily-log': '/lead-gen/daily-outreach',
      'clients': '/lead-gen/clients',
      'time-log': '/lead-gen/time-tracking',
      'tasks': '/lead-gen/team-tasks',
      'calendar': '/lead-gen/delivery-sops',
      'financials': '/lead-gen/financials',
      'settings': '/lead-gen/settings',
    };
    router.push(routeMap[tab] || `/lead-gen/${tab}`);
  };

  return (
    <DashboardView
      data={data}
      onNavigateTab={handleNavigateTab}
      onSelectProspect={openEditLead}
    />
  );
}
