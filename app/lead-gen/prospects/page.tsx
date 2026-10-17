'use client';

import React from 'react';
import ProspectsView from '@/components/leadGen/ProspectsView';
import { useLeadGen } from '../LeadGenContext';

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

  if (!data) return null;

  return (
    <ProspectsView
      prospects={data.prospects}
      onOpenNewModal={openNewLead}
      onEditProspect={openEditLead}
      onDeleteProspect={handleDeleteProspect}
      onUpdateStatus={handleUpdateStatus}
      onUpdateReplyTag={handleUpdateReplyTag}
      onOpenImportModal={openImportModal}
    />
  );
}
