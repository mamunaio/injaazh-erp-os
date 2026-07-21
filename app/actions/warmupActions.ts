'use server';

import connectDB from '@/lib/mongodb';
import { EmailAccount } from '@/models/EmailAccount';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/encryption';

const WARMUP_TEMPLATES = [
  { subject: 'Following up on yesterday', body: 'Hi there,\n\nJust wanted to quickly follow up on our conversation from yesterday. Let me know if you need any further details.\n\nBest,\n[Name]' },
  { subject: 'Quick question about the project', body: 'Hello,\n\nI had a quick question regarding the timeline for our current project. Are we still on track for next week?\n\nThanks,\n[Name]' },
  { subject: 'Checking in', body: 'Hi,\n\nHope you are having a great week! Just checking in to see if there are any updates on your end.\n\nCheers,\n[Name]' },
  { subject: 'Meeting notes', body: 'Hello,\n\nI have attached the notes from our last meeting. Please review them when you get a chance.\n\nBest regards,\n[Name]' },
  { subject: 'Feedback needed', body: 'Hi,\n\nCould you please provide some feedback on the latest draft I sent over? Your input would be highly appreciated.\n\nThanks,\n[Name]' },
];

export async function executeWarmupBatch() {
  try {
    await connectDB();

    // Reset counters for a new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await EmailAccount.updateMany(
      { $or: [{ lastResetDate: { $lt: today } }, { lastResetDate: { $exists: false } }] },
      { $set: { sentToday: 0, warmupSentToday: 0, lastResetDate: new Date() } }
    );

    // Find all accounts that have warmup enabled and haven't reached their daily limit
    const eligibleSenders = await EmailAccount.find({
      isActive: true,
      warmupEnabled: true,
      $expr: { $lt: ['$warmupSentToday', '$warmupDailyLimit'] }
    });

    if (!eligibleSenders || eligibleSenders.length === 0) {
      return { success: true, processed: 0, message: 'No eligible accounts for warmup.' };
    }

    // Find all active accounts to act as potential recipients
    const allActiveAccounts = await EmailAccount.find({ isActive: true });

    if (allActiveAccounts.length < 2) {
      return { success: true, processed: 0, message: 'Not enough connected accounts to perform warmup.' };
    }

    let processedCount = 0;

    for (const sender of eligibleSenders) {
      // Pick a random recipient that is NOT the sender
      const potentialRecipients = allActiveAccounts.filter(acc => acc._id.toString() !== sender._id.toString());
      if (potentialRecipients.length === 0) continue;

      const recipient = potentialRecipients[Math.floor(Math.random() * potentialRecipients.length)];
      const template = WARMUP_TEMPLATES[Math.floor(Math.random() * WARMUP_TEMPLATES.length)];

      const isSmtp = sender.accountType === 'smtp';
      const transporter = nodemailer.createTransport(isSmtp ? {
        host: sender.smtpHost,
        port: sender.smtpPort,
        secure: sender.smtpSecure,
        auth: {
          user: sender.email,
          pass: decrypt(sender.appPassword),
        },
      } : {
        service: 'gmail',
        auth: {
          user: sender.email,
          pass: decrypt(sender.appPassword),
        },
      });

      const body = template.body.replace('[Name]', sender.senderName || sender.email.split('@')[0]);

      try {
        await transporter.sendMail({
          from: sender.senderName ? `"${sender.senderName}" <${sender.email}>` : sender.email,
          to: recipient.email,
          subject: template.subject,
          text: body,
        });

        sender.warmupSentToday = (sender.warmupSentToday || 0) + 1;
        await sender.save();
        processedCount++;

        // Add a small delay between sends
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`Warmup send failed for ${sender.email}:`, err);
      }
    }

    return { success: true, processed: processedCount };
  } catch (error: any) {
    console.error('Execute Warmup Batch Error:', error);
    return { success: false, error: error.message };
  }
}

export async function triggerCronJobsLocally() {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) return { success: false, error: 'No CRON_SECRET found' };
    
    // In dev mode, we know it's localhost:3000. For production, we'd use an absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Fire and forget
    fetch(`${baseUrl}/api/cron/send-warmup`, {
      headers: { authorization: `Bearer ${secret}` }
    }).catch(console.error);
    
    fetch(`${baseUrl}/api/cron/receive-warmup`, {
      headers: { authorization: `Bearer ${secret}` }
    }).catch(console.error);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
