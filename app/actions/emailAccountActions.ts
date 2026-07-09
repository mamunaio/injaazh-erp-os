'use server';

import connectDB from '@/lib/mongodb';
import { EmailAccount } from '@/models/EmailAccount';
import nodemailer from 'nodemailer';
import { getAuthUser } from '@/lib/auth';
import { createNotification } from './notificationActions';

export async function addEmailAccount(data: { 
  email: string; 
  senderName?: string;
  appPassword: string; 
  dailyLimit: number;
  accountType?: 'gmail' | 'smtp';
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
}) {
  try {
    await connectDB();
    
    // Verify credentials first
    const isSmtp = data.accountType === 'smtp';
    const transporter = nodemailer.createTransport(isSmtp ? {
      host: data.smtpHost,
      port: data.smtpPort,
      secure: data.smtpSecure,
      auth: {
        user: data.email,
        pass: data.appPassword,
      },
    } : {
      service: 'gmail',
      auth: {
        user: data.email,
        pass: data.appPassword,
      },
    });

    try {
      await transporter.verify();
    } catch (verifyError: any) {
      return { success: false, error: isSmtp ? 'Invalid SMTP credentials or host/port configuration.' : 'Invalid Gmail credentials. Please check your email and App Password.' };
    }

    const currentUser = await getAuthUser();
    if (!currentUser) return { success: false, error: 'Unauthorized' };

    const newAccount = await EmailAccount.create({
      email: data.email,
      senderName: data.senderName,
      appPassword: data.appPassword,
      dailyLimit: data.dailyLimit,
      accountType: data.accountType || 'gmail',
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpSecure: data.smtpSecure,
      userId: currentUser.id,
      isGlobal: false,
    });

    await createNotification('system', `New email account ${data.email} has been connected.`);

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
    const currentUser = await getAuthUser();
    if (!currentUser) return { success: false, error: 'Unauthorized' };

    // LAZY RESET: Reset sentToday for accounts that weren't reset today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await EmailAccount.updateMany(
      { $or: [{ lastResetDate: { $lt: today } }, { lastResetDate: { $exists: false } }] },
      { $set: { sentToday: 0, warmupSentToday: 0, lastResetDate: new Date() } }
    );

    // Fetch user's own accounts, global accounts, AND legacy accounts without a userId
    const query = {
      $or: [
        { userId: currentUser.id },
        { isGlobal: true },
        { userId: { $exists: false } }
      ]
    };

    const accounts = await EmailAccount.find(query).sort({ createdAt: -1 });
    return { success: true, accounts: JSON.parse(JSON.stringify(accounts)) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch email accounts' };
  }
}

export async function deleteEmailAccount(id: string) {
  try {
    await connectDB();
    const account = await EmailAccount.findByIdAndDelete(id);
    if (account) {
      await createNotification('system', `Email account ${account.email} has been removed.`);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete email account' };
  }
}

export async function updateEmailAccountStatus(id: string, isActive: boolean) {
  try {
    await connectDB();
    const account = await EmailAccount.findByIdAndUpdate(id, { isActive }, { new: true });
    if (account) {
      await createNotification('system', `Email account ${account.email} has been ${isActive ? 'activated' : 'paused'}.`);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update email account status' };
  }
}

export async function updateWarmupSettings(id: string, warmupEnabled: boolean, warmupDailyLimit: number) {
  try {
    await connectDB();
    const account = await EmailAccount.findByIdAndUpdate(id, { warmupEnabled, warmupDailyLimit }, { new: true });
    if (account) {
      await createNotification('system', `Auto-Warmup for ${account.email} is now ${warmupEnabled ? 'ON' : 'OFF'}.`);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update warmup settings' };
  }
}
