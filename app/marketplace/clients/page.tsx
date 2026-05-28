import React from 'react';
import { getMarketplaceClients } from '@/actions/marketplaceClientActions';
import ClientHubClient from './ClientHubClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace Clients | Injaazh ERP',
  description: 'Manage your marketplace and freelance clients.',
};

export const dynamic = 'force-dynamic';

export default async function MarketplaceClientsPage() {
  const result = await getMarketplaceClients();
  const initialClients = result.success ? result.data : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <ClientHubClient initialClients={initialClients} />
      </div>
    </div>
  );
}
