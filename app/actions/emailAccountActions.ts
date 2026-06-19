'use server';

import connectDB from '@/lib/mongodb';
import { EmailAccount } from '@/models/EmailAccount';
import nodemailer from 'nodemailer';

export async function addEmailAccount(data: { email: string; appPassword: string; dailyLimit: number }) {
  try {
    await connectDB();
    
    // Verify credentials first
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: data.email,
        pass: data.appPassword,
      },
    });

    try {
      await transporter.verify();
    } catch (verifyError: any) {
      return { success: false, error: 'Invalid Gmail credentials. Please check your email and App Password.' };
    }

    const newAccount = await EmailAccount.create({
      email: data.email,
      appPassword: data.appPassword,
      dailyLimit: data.dailyLimit,
    });

    return { success: true, account: JSON.parse(JSON.stringify(newAccount)) };
  } catch (error: any) {
    if (error.code === 11000) {
      return { success: false, error: 'This email account is already registered.' };
    }
    return { success: false, error: error.message || 'Failed to add email account' };
  }
}

export async function getEmailAccounts() {
  try {
    await connectDB();
    const accounts = await EmailAccount.find({}).sort({ createdAt: -1 });
    return { success: true, accounts: JSON.parse(JSON.stringify(accounts)) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch email accounts' };
  }
}

export async function deleteEmailAccount(id: string) {
  try {
    await connectDB();
    await EmailAccount.findByIdAndDelete(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete email account' };
  }
}

export async function updateEmailAccountStatus(id: string, isActive: boolean) {
  try {
    await connectDB();
    await EmailAccount.findByIdAndUpdate(id, { isActive });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update email account status' };
  }
}
