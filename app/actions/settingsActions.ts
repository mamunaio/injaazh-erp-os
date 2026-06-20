'use server';

import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/mongodb';
import { SystemSettings } from '@/models/SystemSettings';
import { EmailAccount } from '@/models/EmailAccount';

export async function getSystemSettings(key: string) {
  try {
    await connectToDatabase();
    const settings = await SystemSettings.findOne({ key }).lean();
    return {
      success: true,
      data: settings ? (settings.value as any) : null,
    };
  } catch (error: any) {
    console.error(`❌ Error fetching system settings for key ${key}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to fetch settings.',
    };
  }
}

export async function saveSystemSettings(key: string, value: any) {
  try {
    await connectToDatabase();
    const settings = await SystemSettings.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );

    // Sync SMTP settings to EmailAccounts collection for unified Outreach dropdown and rotation
    if (key === 'smtp' && value?.user && value?.pass) {
      await EmailAccount.findOneAndUpdate(
        { email: value.user },
        {
          appPassword: value.pass,
          accountType: 'smtp',
          smtpHost: value.host,
          smtpPort: Number(value.port) || 465,
          smtpSecure: Number(value.port) === 465,
          isActive: true,
          isGlobal: true,
          $setOnInsert: {
            dailyLimit: 100, // Default generous limit for global SMTP
            sentToday: 0
          }
        },
        { upsert: true, new: true }
      );
    } else if (key === 'smtp' && (!value?.user || !value?.pass)) {
      // If SMTP is cleared, we could deactivate or delete the associated SMTP account.
      // But we might not know which one it was if they just cleared the form. 
      // It's fine to leave it as is or handle it explicitly if needed.
    }

    return {
      success: true,
      data: settings.value,
    };
  } catch (error: any) {
    console.error(`❌ Error saving system settings for key ${key}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to save settings.',
    };
  }
}

export async function testSmtpConnection(settings: {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: Number(settings.port),
      secure: Number(settings.port) === 465,
      auth: {
        user: settings.user,
        pass: settings.pass,
      },
      connectionTimeout: 8000, // 8 seconds timeout limit
    });

    // Verify transporter connection handshake
    await transporter.verify();

    return {
      success: true,
      message: 'SMTP connection established successfully! Credentials are valid.',
    };
  } catch (error: any) {
    console.error('❌ SMTP test connection failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to SMTP server. Please check your configurations.',
    };
  }
}
