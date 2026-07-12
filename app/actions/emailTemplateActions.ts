'use server';

import connectToDatabase from '@/lib/mongodb';
import { EmailTemplate } from '@/models/EmailTemplate';
import { getAuthUser } from '@/lib/auth';

// Helper to check authentication
async function requireAuth() {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new Error('Not authenticated.');
  }
  return authUser;
}

export async function getEmailTemplates() {
  try {
    await requireAuth();
    await connectToDatabase();
    
    const templates = await EmailTemplate.find({}).sort({ createdAt: -1 }).lean();
    
    return { 
      success: true, 
      templates: templates.map(t => ({
        ...t,
        _id: t._id.toString()
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch templates' };
  }
}

export async function createEmailTemplate(data: {
  name: string;
  subject: string;
  body: string;
  icon?: string;
  color?: string;
}) {
  try {
    await requireAuth();
    await connectToDatabase();
    
    const newTemplate = await EmailTemplate.create(data);
    
    return { 
      success: true, 
      template: {
        ...newTemplate.toObject(),
        _id: newTemplate._id.toString()
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create template' };
  }
}

export async function deleteEmailTemplate(id: string) {
  try {
    await requireAuth();
    await connectToDatabase();
    
    await EmailTemplate.findByIdAndDelete(id);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete template' };
  }
}
