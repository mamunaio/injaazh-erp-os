'use client';

import React from 'react';
import SettingsView from '@/components/leadGen/SettingsView';
import { useLeadGen } from '../LeadGenContext';

export default function SettingsSubPage() {
  const {
    data,
    handleUpdateSettings,
    handleExportExcel,
    handleResetDatabase,
  } = useLeadGen();

  if (!data) return null;

  return (
    <SettingsView
      settings={data.settings}
      data={data}
      onUpdateSettings={handleUpdateSettings}
      onExportExcel={handleExportExcel}
      onResetDatabase={handleResetDatabase}
    />
  );
}
