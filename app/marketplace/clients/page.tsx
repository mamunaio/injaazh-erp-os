import React from 'react';
import { getMarketplaceClients } from '@/actions/marketplaceClientActions';
import { getMarketplaceProjects } from '@/app/actions/marketplaceActions';
import { getProjectsBoard } from '@/app/actions/projectActions';
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

  const [result, projects, generalProjectsRes] = await Promise.all([
    getMarketplaceClients(),
    getMarketplaceProjects(),
    getProjectsBoard()
  ]);
  
  const initialClients = result.success ? result.data : [];
  const generalProjects = generalProjectsRes.success ? generalProjectsRes.data : [];

  // Calculate total spent per client based on paid milestones and completed projects without double counting
  const clientsWithSpending = initialClients.map((client: any) => {
    let totalSpent = 0;
    const clientProjects: any[] = [];
    const seenProjectIds = new Set<string>();
    const seenProjectTitles = new Set<string>();
    
    // Process Marketplace Projects
    projects.forEach((project: any) => {
      // Check if project belongs to this client
      const matchesClient = 
        (project.clientId && project.clientId.toString() === client._id.toString()) ||
        (project.clientDetails?.clientName && project.clientDetails?.clientName.toLowerCase() === client.name?.toLowerCase()) ||
        (project.clientName && project.clientName.toLowerCase() === client.name?.toLowerCase());
        
      if (matchesClient) {
        let paidMilestonesSum = 0;
        if (project.milestones && Array.isArray(project.milestones)) {
          project.milestones.forEach((m: any) => {
            if (m.status === 'Paid') {
              paidMilestonesSum += parseFloat(m.amount) || 0;
            }
          });
        }
        
        const budgetValue = project.budget ? parseFloat(String(project.budget).replace(/[^0-9.-]+/g, '')) || 0 : 0;
        
        // If there are paid milestones, use that sum. 
        // Otherwise, if the project is fully completed, assume the full budget was paid.
        const earned = paidMilestonesSum > 0 
          ? paidMilestonesSum 
          : (project.status === 'Completed' ? budgetValue : 0);
          
        totalSpent += earned;
        seenProjectIds.add(project._id.toString());
        if (project.title) {
          seenProjectTitles.add(project.title.toLowerCase().trim());
        }

        clientProjects.push({
          _id: project._id,
          title: project.title,
          platform: project.platform || client.platform,
          status: project.status || 'In Progress',
          budget: project.budget,
          earned: earned,
          createdAt: project.createdAt
        });
      }
    });

    // Process General Projects (from Work -> Projects) ONLY if not already counted via Marketplace Projects
    generalProjects.forEach((project: any) => {
      const matchesClient = 
        project.clientName && project.clientName.toLowerCase() === client.name?.toLowerCase();

      if (!matchesClient) return;

      // Check if this project was already counted via MarketplaceProject (by marketplaceProjectId, ID, or title)
      const isAlreadyInMarketplace = 
        (project.marketplaceProjectId && seenProjectIds.has(project.marketplaceProjectId.toString())) ||
        seenProjectIds.has(project._id.toString()) ||
        (project.title && seenProjectTitles.has(project.title.toLowerCase().trim()));

      if (isAlreadyInMarketplace) {
        // Skip duplicate! Already counted in Marketplace Projects.
        return;
      }

      // If it's a unique general project belonging to this client:
      const budgetValue = typeof project.budget === 'number' ? project.budget : parseFloat(String(project.budget || '0').replace(/[^0-9.-]+/g, '')) || 0;
      const earned = project.status === 'Completed' ? budgetValue : 0;
      totalSpent += earned;

      seenProjectIds.add(project._id.toString());
      if (project.title) {
        seenProjectTitles.add(project.title.toLowerCase().trim());
      }

      clientProjects.push({
        _id: project._id,
        title: project.title,
        platform: project.platform || 'Direct',
        status: project.status || 'In Progress',
        budget: typeof project.budget === 'number' ? `$${project.budget}` : (project.budget || '$0'),
        earned: earned,
        createdAt: project.createdAt
      });
    });

    return { 
      ...client, 
      totalSpent, 
      projectCount: clientProjects.length,
      projects: clientProjects 
    };
  });

  return (
    <ClientHubClient initialClients={clientsWithSpending} allProjects={projects} />
  );
}
