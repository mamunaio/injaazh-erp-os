'use server';

import connectToDatabase from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { Project } from '@/models/Project';
import { Proposal } from '@/models/Proposal';
import { Transaction } from '@/models/Transaction';
import MarketplaceProject from '@/models/MarketplaceProject';
import SeoProject from '@/models/SeoProject';
import { Campaign } from '@/models/Campaign';
import { EmailCampaignLog } from '@/models/EmailCampaignLog';
import { EmailAccount } from '@/models/EmailAccount';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

// Middleware helper to check if logged in user is admin
async function requireAdmin() {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error('Unauthorized. Admin access required.');
  }
  await connectToDatabase();
  const dbUser = await User.findById(authUser.id);
  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'owner')) {
    throw new Error('Unauthorized. Admin access required.');
  }
  return authUser;
}

export async function factoryResetDatabase() {
  try {
    // Ensure only admins can do this
    await requireAdmin();
    await connectToDatabase();

    // Delete everything EXCEPT users and settings
    await Promise.all([
      Lead.deleteMany({}),
      Project.deleteMany({}),
      Proposal.deleteMany({}),
      Transaction.deleteMany({}),
      MarketplaceProject.deleteMany({}),
      SeoProject.deleteMany({}),
      Campaign.deleteMany({}),
      EmailCampaignLog.deleteMany({}),
      EmailAccount.deleteMany({})
    ]);

    return { success: true, message: 'Database reset successfully' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reset database' };
  }
}
