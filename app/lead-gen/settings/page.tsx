'use client';

import React from 'react';
import SettingsView from '@/components/leadGen/SettingsView';
import { useLeadGen } from '../LeadGenContext';
import { Loader2 } from 'lucide-react';

export default function SettingsSubPage() {
  const {
    data,
    handleUpdateSettings,
    handleExportExcel,
    handleResetDatabase,
  } = useLeadGen();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
      </div>
    );
  }

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
