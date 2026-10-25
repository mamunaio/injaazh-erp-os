'use client';

import React from 'react';
import TimeLogView from '@/components/leadGen/TimeLogView';
import { useLeadGen } from '../LeadGenContext';
import { Loader2 } from 'lucide-react';

export default function TimeTrackingSubPage() {
  const { data, handleAddTimeLog, handleUpdateTimeLog, handleDeleteTimeLog } = useLeadGen();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
      </div>
    );
  }

  return (
    <TimeLogView
      timeLogs={data.timeLogs || []}
      clients={data.clients || []}
      onAddTimeLog={handleAddTimeLog}
      onUpdateTimeLog={handleUpdateTimeLog}
      onDeleteTimeLog={handleDeleteTimeLog}
    />
  );
}
