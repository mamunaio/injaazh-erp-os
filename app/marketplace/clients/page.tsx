import React from 'react';
import { getMarketplaceClients } from '@/actions/marketplaceClientActions';
import { getMarketplaceProjects } from '@/app/actions/marketplaceActions';
import ClientHubClient from './ClientHubClient';
import { Metadata } from 'next';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Marketplace Clients | Injaazh ERP',
  description: 'Manage your marketplace and freelance clients.',
};

export const dynamic = 'force-dynamic';

export default async function MarketplaceClientsPage() {
  const authUser = await getAuthUser();
  if (!authUser || !['owner', 'admin', 'marketplace_team'].includes(authUser.role)) {
    redirect('/dashboard');
  }

  const [result, projects] = await Promise.all([
    getMarketplaceClients(),
    getMarketplaceProjects()
  ]);
  
  const initialClients = result.success ? result.data : [];

  // Calculate total spent per client based on paid milestones and completed projects
  const clientsWithSpending = initialClients.map((client: any) => {
    let totalSpent = 0;
    
    projects.forEach((project: any) => {
      // Check if project belongs to this client
      // The project might have client details (direct name matching) or clientId (reference)
      const matchesClient = 
        (project.clientId && project.clientId.toString() === client._id.toString()) ||
        (project.clientDetails?.clientName === client.name);
        
      if (matchesClient) {
        let paidMilestonesSum = 0;
        if (project.milestones && Array.isArray(project.milestones)) {
          project.milestones.forEach((m: any) => {
            if (m.status === 'Paid') {
              paidMilestonesSum += parseFloat(m.amount) || 0;
            }
          });
        }
        
        const budgetValue = project.budget ? parseFloat(project.budget.replace(/[^0-9.-]+/g, '')) : 0;
        
        // If there are paid milestones, use that sum. 
        // Otherwise, if the project is fully completed, assume the full budget was paid.
        const earned = paidMilestonesSum > 0 
          ? paidMilestonesSum 
          : (project.status === 'Completed' ? budgetValue : 0);
          
        totalSpent += earned;
      }
    });

    return { ...client, totalSpent };
  });

  return (
    <div className="min-h-screen neu-base-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <ClientHubClient initialClients={clientsWithSpending} />
      </div>
    </div>
  );
}
