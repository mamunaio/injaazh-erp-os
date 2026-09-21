'use server';

import connectToDatabase from '@/lib/mongodb';
import { Project } from '@/models/Project';
import { Transaction } from '@/models/Transaction';
import MarketplaceProject from '@/models/MarketplaceProject';
import SeoProject from '@/models/SeoProject';
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
      Project.deleteMany({}),
      Transaction.deleteMany({}),
      MarketplaceProject.deleteMany({}),
      SeoProject.deleteMany({})
    ]);

    return { success: true, message: 'Database reset successfully' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to reset database' };
  }
}
