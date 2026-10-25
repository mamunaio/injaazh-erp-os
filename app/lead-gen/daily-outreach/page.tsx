'use client';

import React from 'react';
import DailyLogView from '@/components/leadGen/DailyLogView';
import { useLeadGen } from '../LeadGenContext';
import { Loader2 } from 'lucide-react';

export default function DailyOutreachSubPage() {
  const { data, handleAddDailyLog, handleUpdateDailyLog, handleDeleteDailyLog } = useLeadGen();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
      </div>
    );
  }

  return (
    <DailyLogView
      dailyLogs={data.dailyLogs || []}
      settings={data.settings}
      onAddDailyLog={handleAddDailyLog}
      onUpdateDailyLog={handleUpdateDailyLog}
      onDeleteDailyLog={handleDeleteDailyLog}
    />
  );
}
