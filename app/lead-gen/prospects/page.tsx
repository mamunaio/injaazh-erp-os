'use client';

import React from 'react';
import ProspectsView from '@/components/leadGen/ProspectsView';
import { useLeadGen } from '../LeadGenContext';
import { Loader2 } from 'lucide-react';

export default function ProspectsSubPage() {
  const {
    data,
    openNewLead,
    openEditLead,
    handleDeleteProspect,
    handleUpdateStatus,
    handleUpdateReplyTag,
    openImportModal,
  } = useLeadGen();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
      </div>
    );
  }

  return (
    <ProspectsView
      prospects={data.prospects || []}
      onOpenNewModal={openNewLead}
      onEditProspect={openEditLead}
      onDeleteProspect={handleDeleteProspect}
      onUpdateStatus={handleUpdateStatus}
      onUpdateReplyTag={handleUpdateReplyTag}
      onOpenImportModal={openImportModal}
    />
  );
}
