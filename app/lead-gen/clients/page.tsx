'use client';

import React from 'react';
import ClientsView from '@/components/leadGen/ClientsView';
import { useLeadGen } from '../LeadGenContext';
import { Loader2 } from 'lucide-react';

export default function ClientsSubPage() {
  const { data, handleAddClient, handleUpdateClient, handleDeleteClient } = useLeadGen();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
      </div>
    );
  }

  return (
    <ClientsView
      clients={data.clients || []}
      timeLogs={data.timeLogs || []}
      settings={data.settings}
      onAddClient={handleAddClient}
      onUpdateClient={handleUpdateClient}
      onDeleteClient={handleDeleteClient}
    />
  );
}
