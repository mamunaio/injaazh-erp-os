'use client';

import React from 'react';
import FinancialsView from '@/components/leadGen/FinancialsView';
import { useLeadGen } from '../LeadGenContext';
import { Loader2 } from 'lucide-react';

export default function FinancialsSubPage() {
  const {
    data,
    handleAddInvoice,
    handleUpdateInvoice,
    handleDeleteInvoice,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
  } = useLeadGen();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
      </div>
    );
  }

  return (
    <FinancialsView
      invoices={data.invoices || []}
      expenses={data.expenses || []}
      clients={data.clients || []}
      onAddInvoice={handleAddInvoice}
      onUpdateInvoice={handleUpdateInvoice}
      onDeleteInvoice={handleDeleteInvoice}
      onAddExpense={handleAddExpense}
      onUpdateExpense={handleUpdateExpense}
      onDeleteExpense={handleDeleteExpense}
    />
  );
}
