'use client';

import React from 'react';
import ClientsView from '@/components/leadGen/ClientsView';
import { useLeadGen } from '../LeadGenContext';

export default function ClientsSubPage() {
  const { data, handleAddClient, handleUpdateClient } = useLeadGen();

  if (!data) return null;

  return (
    <ClientsView
      clients={data.clients}
      timeLogs={data.timeLogs}
      settings={data.settings}
      onAddClient={handleAddClient}
      onUpdateClient={handleUpdateClient}
    />
  );
}
