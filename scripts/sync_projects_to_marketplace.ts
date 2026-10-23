import connectDB from '../lib/mongodb';
import { Project } from '../models/Project';
import MarketplaceProject from '../models/MarketplaceProject';
import MarketplaceClient from '../models/MarketplaceClient';

async function syncProjects() {
  await connectDB();
  console.log('--- STARTING SYNC: /projects -> Marketplace ---');

  const projects = await Project.find({}).lean();
  const clients = await MarketplaceClient.find({}).lean();

  const clientMap = new Map();
  clients.forEach(c => clientMap.set(c.name.toLowerCase().trim(), c));

  let createdCount = 0;
  let updatedCount = 0;

  for (const p of projects) {
    const plat = (p.platform === 'Freelancer' || p.platform === 'Direct' || p.platform === 'Upwork' || p.platform === 'Fiverr')
      ? p.platform
      : 'Direct';

    const cName = (p.clientName || '').toLowerCase().trim();
    const matchedClient = clientMap.get(cName);

    const status = (p.status === 'Completed' || p.status === 'In Progress' || p.status === 'In Review')
      ? p.status
      : 'Planning';

    const budgetNum = typeof p.budget === 'number' ? p.budget : parseFloat(p.budget || '0') || 0;
    const deadlineDate = p.deadline || p.createdAt || new Date();
    const dateStr = deadlineDate instanceof Date ? deadlineDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const milestones = status === 'Completed'
      ? [{
          id: 1,
          description: 'Project Delivery & Milestone Release',
          date: dateStr,
          status: 'Paid',
          amount: budgetNum
        }]
      : [{
          id: 1,
          description: 'In-Flight Milestone Deliverable',
          date: dateStr,
          status: 'Pending',
          amount: budgetNum
        }];

    // Check if MarketplaceProject already exists
    let existingMP = null;
    if (p.marketplaceProjectId) {
      existingMP = await MarketplaceProject.findById(p.marketplaceProjectId);
    }
    if (!existingMP) {
      existingMP = await MarketplaceProject.findOne({ title: p.title, platform: plat });
    }

    if (existingMP) {
      // Update existing
      existingMP.status = status;
      existingMP.budget = `$${budgetNum}`;
      existingMP.progress = p.progress ?? (status === 'Completed' ? 100 : 0);
      existingMP.clientDetails = {
        clientName: p.clientName || (matchedClient ? matchedClient.name : 'Direct Client'),
        company: matchedClient?.company || '',
        timezone: matchedClient?.timezone || 'UTC'
      };
      if (matchedClient) existingMP.clientId = matchedClient._id;
      if (p.deadline) existingMP.deadline = p.deadline;
      if (p.startDate) existingMP.startDate = p.startDate;
      await existingMP.save();

      // Ensure Project has the reference
      await Project.findByIdAndUpdate(p._id, { 
        marketplaceProjectId: existingMP._id,
        clientId: matchedClient?._id 
      });
      updatedCount++;
      console.log(`Updated existing MarketplaceProject: "${p.title}" [${plat}]`);
    } else {
      // Create new MarketplaceProject
      const newMP = await MarketplaceProject.create({
        title: p.title,
        platform: plat,
        status: status,
        budget: `$${budgetNum}`,
        scope: p.description || '',
        tasks: [{
          id: 1,
          title: p.title,
          completed: status === 'Completed'
        }],
        milestones: milestones,
        files: [],
        startDate: p.startDate || p.createdAt,
        deadline: p.deadline,
        clientId: matchedClient?._id || null,
        clientDetails: {
          clientName: p.clientName || (matchedClient ? matchedClient.name : 'Direct Client'),
          company: matchedClient?.company || '',
          timezone: matchedClient?.timezone || 'UTC'
        },
        progress: p.progress ?? (status === 'Completed' ? 100 : 0),
        createdAt: p.createdAt || new Date(),
        updatedAt: p.updatedAt || new Date()
      });

      // Link Project to MarketplaceProject
      await Project.findByIdAndUpdate(p._id, {
        marketplaceProjectId: newMP._id,
        clientId: matchedClient?._id
      });
      createdCount++;
      console.log(`Created MarketplaceProject: "${p.title}" [${plat}] - $${budgetNum}`);
    }
  }

  console.log(`\n=== SYNC COMPLETE ===`);
  console.log(`Total Projects Processed: ${projects.length}`);
  console.log(`Created: ${createdCount}`);
  console.log(`Updated: ${updatedCount}`);

  const totalMP = await MarketplaceProject.find({}).lean();
  console.log(`Total Marketplace Projects Now in DB: ${totalMP.length}`);

  const counts: Record<string, { total: number; completed: number; inProgress: number }> = {};
  totalMP.forEach(m => {
    if (!counts[m.platform]) counts[m.platform] = { total: 0, completed: 0, inProgress: 0 };
    counts[m.platform].total++;
    if (m.status === 'Completed') counts[m.platform].completed++;
    if (m.status === 'In Progress') counts[m.platform].inProgress++;
  });

  console.log('Platform Breakdown:', counts);
  process.exit(0);
}

syncProjects().catch(err => {
  console.error('Sync Error:', err);
  process.exit(1);
});
