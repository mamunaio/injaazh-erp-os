'use client';

import React from 'react';
import DeliveryCalendarView from '@/components/leadGen/DeliveryCalendarView';
import { useLeadGen } from '../LeadGenContext';

export default function DeliverySopsSubPage() {
  const { data, handleAddDeliveryItem, handleUpdateDeliveryItem } = useLeadGen();

  if (!data) return null;

  return (
    <DeliveryCalendarView
      items={data.deliveryCalendar}
      clients={data.clients}
      onAddItem={handleAddDeliveryItem}
      onUpdateItem={handleUpdateDeliveryItem}
    />
  );
}
