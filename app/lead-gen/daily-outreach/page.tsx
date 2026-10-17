'use client';

import React from 'react';
import DailyLogView from '@/components/leadGen/DailyLogView';
import { useLeadGen } from '../LeadGenContext';

export default function DailyOutreachSubPage() {
  const { data, handleAddDailyLog } = useLeadGen();

  if (!data) return null;

  return (
    <DailyLogView
      dailyLogs={data.dailyLogs}
      settings={data.settings}
      onAddDailyLog={handleAddDailyLog}
    />
  );
}
