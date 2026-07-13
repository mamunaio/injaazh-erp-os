'use server';

import connectDB from '@/lib/mongodb';
import { EmailTemplate } from '@/models/EmailTemplate';

export async function getEmailTemplates() {
  try {
    await connectDB();
    const templates = await EmailTemplate.find().sort({ createdAt: -1 }).lean();
    return { success: true, templates: JSON.parse(JSON.stringify(templates)) };
  } catch (error: any) {
    console.error('Error fetching email templates:', error);
    return { success: false, error: error.message, templates: [] };
  }
}

export async function createEmailTemplate(data: { name: string, subject: string, body: string, icon?: string, color?: string }) {
  try {
    await connectDB();
    const newTemplate = new EmailTemplate(data);
    await newTemplate.save();
    return { success: true, template: JSON.parse(JSON.stringify(newTemplate)) };
  } catch (error: any) {
    console.error('Error creating email template:', error);
    return { success: false, error: error.message };
  }
}

export async function updateEmailTemplate(id: string, data: Partial<{ name: string, subject: string, body: string, icon: string, color: string }>) {
  try {
    await connectDB();
    const updatedTemplate = await EmailTemplate.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updatedTemplate) {
      return { success: false, error: 'Template not found' };
    }
    return { success: true, template: JSON.parse(JSON.stringify(updatedTemplate)) };
  } catch (error: any) {
    console.error('Error updating email template:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteEmailTemplate(id: string) {
  try {
    await connectDB();
    const result = await EmailTemplate.findByIdAndDelete(id);
    if (!result) {
      return { success: false, error: 'Template not found' };
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    return { success: false, error: error.message };
  }
}
