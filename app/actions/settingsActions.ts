'use server';

import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/mongodb';
import { SystemSettings } from '@/models/SystemSettings';

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
