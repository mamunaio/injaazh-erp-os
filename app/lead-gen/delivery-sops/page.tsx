'use client';

import React from 'react';
import DeliveryCalendarView from '@/components/leadGen/DeliveryCalendarView';
import { useLeadGen } from '../LeadGenContext';
import { Loader2 } from 'lucide-react';

export default function DeliverySopsSubPage() {
  const { data, handleAddDeliveryItem, handleUpdateDeliveryItem, handleDeleteDeliveryItem } = useLeadGen();

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6324FC]" />
      </div>
    );
  }

  return (
    <DeliveryCalendarView
      items={data.deliveryCalendar || []}
      clients={data.clients || []}
      onAddItem={handleAddDeliveryItem}
      onUpdateItem={handleUpdateDeliveryItem}
      onDeleteItem={handleDeleteDeliveryItem}
    />
  );
}
