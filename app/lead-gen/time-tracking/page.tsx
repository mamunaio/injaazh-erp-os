'use client';

import React from 'react';
import TimeLogView from '@/components/leadGen/TimeLogView';
import { useLeadGen } from '../LeadGenContext';

export default function TimeTrackingSubPage() {
  const { data, handleAddTimeLog, handleUpdateTimeLog, handleDeleteTimeLog } = useLeadGen();

  if (!data) return null;

  return (
    <TimeLogView
      timeLogs={data.timeLogs}
      clients={data.clients}
      onAddTimeLog={handleAddTimeLog}
      onUpdateTimeLog={handleUpdateTimeLog}
      onDeleteTimeLog={handleDeleteTimeLog}
    />
  );
}
