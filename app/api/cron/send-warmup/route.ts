import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { EmailAccount } from '@/models/EmailAccount';
import { WarmupLog } from '@/models/WarmupLog';
import nodemailer from 'nodemailer';

export const maxDuration = 60; // 60 seconds (Vercel max for some plans)

const SUBJECTS = [
  'Quick question about your services',
  'Following up on our last conversation',
  'Meeting next week?',
  'Checking in',
  'Introduction & Partnership',
  'Information request',
  'Hello from Injaazh',
  'Project details attached'
];

const BODIES = [
  'Hi there,\n\nI hope this email finds you well. I wanted to quickly follow up regarding our previous discussion. Let me know when you have some free time to chat.\n\nBest,\nUser',
  'Hello,\n\nCould you please send over the details we discussed yesterday? I need them to finalize the report.\n\nThanks!',
  'Hey,\n\nJust checking in to see if you are available for a quick 10-minute call tomorrow morning.\n\nRegards,',
  'Hi,\n\nI was reviewing your profile and think there might be a good synergy between our teams. Let me know if you are open to a quick chat.\n\nBest wishes,',
  'Good morning,\n\nI am reaching out to request some more information about your pricing plans. Do you have a brochure you can share?\n\nThanks in advance.',
];

function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function GET(request: Request) {
  try {
    // Validate auth if needed (e.g., Vercel Cron Secret)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow local testing, but enforce in prod
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await connectToDatabase();

    // Reset daily quotas if it's a new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await EmailAccount.updateMany(
      { $or: [{ lastResetDate: { $lt: today } }, { lastResetDate: { $exists: false } }] },
      { $set: { sentToday: 0, warmupSentToday: 0, lastResetDate: new Date() } }
    );

    // Find all active warmup accounts
    const warmupAccounts = await EmailAccount.find({
      isActive: true,
      warmupEnabled: true,
      $expr: { $lt: ['$warmupSentToday', '$warmupDailyLimit'] }
    });

    if (warmupAccounts.length < 2) {
      return NextResponse.json({ success: true, message: 'Not enough active warmup accounts to form a P2P network.' });
    }

    let sentCount = 0;

    // Process each account (sending 1 email per run to avoid huge spikes)
    for (const senderAccount of warmupAccounts) {
      // Pick a random receiver that is NOT the sender
      const possibleReceivers = warmupAccounts.filter(a => a._id.toString() !== senderAccount._id.toString());
      if (possibleReceivers.length === 0) continue;
      
      const receiverAccount = possibleReceivers[Math.floor(Math.random() * possibleReceivers.length)];

      const subject = getRandomItem(SUBJECTS);
      const body = getRandomItem(BODIES);

      // Create Transporter
      const isSmtp = senderAccount.accountType === 'smtp';
      const transporter = nodemailer.createTransport(isSmtp ? {
        host: senderAccount.smtpHost,
        port: senderAccount.smtpPort,
        secure: senderAccount.smtpSecure,
        auth: {
          user: senderAccount.email,
          pass: senderAccount.appPassword,
        },
      } : {
        service: 'gmail',
        auth: {
          user: senderAccount.email,
          pass: senderAccount.appPassword,
        },
      });

      const mailOptions = {
        from: `"${senderAccount.senderName || 'Warmup'}" <${senderAccount.email}>`,
        to: receiverAccount.email,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br />'),
        headers: {
          'X-Injaazh-Warmup': 'true' // Hidden header to identify warmup emails in IMAP
        }
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        
        // Log it
        await WarmupLog.create({
          senderAccountId: senderAccount._id,
          receiverAccountId: receiverAccount._id,
          subject,
          body,
          messageId: info.messageId,
          status: 'sent'
        });

        // Increment quota
        await EmailAccount.findByIdAndUpdate(senderAccount._id, { $inc: { warmupSentToday: 1 } });
        sentCount++;
      } catch (err: any) {
        console.error(`Warmup send failed for ${senderAccount.email}:`, err);
      }
    }

    return NextResponse.json({ success: true, message: `Sent ${sentCount} warmup emails.` });

  } catch (error: any) {
    console.error('Send Warmup Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
