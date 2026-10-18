'use client';

import React from 'react';
import FinancialsView from '@/components/leadGen/FinancialsView';
import { useLeadGen } from '../LeadGenContext';

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

  if (!data) return null;

  return (
    <FinancialsView
      invoices={data.invoices}
      expenses={data.expenses}
      clients={data.clients}
      onAddInvoice={handleAddInvoice}
      onUpdateInvoice={handleUpdateInvoice}
      onDeleteInvoice={handleDeleteInvoice}
      onAddExpense={handleAddExpense}
      onUpdateExpense={handleUpdateExpense}
      onDeleteExpense={handleDeleteExpense}
    />
  );
}
