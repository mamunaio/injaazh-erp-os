import imaps from 'imap-simple';
import { EmailAccount } from '@/models/EmailAccount';
import { EmailCampaignLog } from '@/models/EmailCampaignLog';
import { Lead } from '@/models/Lead';
import connectDB from '@/lib/mongodb';

export async function checkRepliesForAccount(account: any) {
  const config = {
    imap: {
      user: account.email,
      password: account.appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 3000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Search for unread emails from the last 5 days
    // node-imap requires a JS Date object for SINCE, not an ISO string!
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const searchCriteria = [
      'UNREAD',
      ['SINCE', fiveDaysAgo]
    ];
    
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT MESSAGE-ID IN-REPLY-TO REFERENCES DATE)'],
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    for (const msg of messages) {
      const headerPart = msg.parts.find(part => part.which.includes('HEADER'));
      if (!headerPart) continue;

      const headers = headerPart.body;
      let inReplyTo = headers['in-reply-to'] ? headers['in-reply-to'][0] : null;

      if (!inReplyTo) continue;

      // Clean the Message-ID format (e.g., <msg-id>)
      inReplyTo = inReplyTo.replace(/[<>]/g, '').trim();

      // Check if this matches a sent campaign log
      await connectDB();
      const log = await EmailCampaignLog.findOne({ messageId: new RegExp(inReplyTo, 'i') });

      if (log) {
        // We found a reply to our campaign!
        const lead = await Lead.findById(log.leadId);
        if (lead && !lead.is_replied) {
          const subject = headers['subject'] ? headers['subject'][0] : 'No Subject';
          
          lead.is_replied = true;
          lead.outreach_status = 'Replied';
          lead.nextFollowUpDate = undefined; // Stop follow ups
          lead.last_reply_subject = subject; // Save the subject
          await lead.save();

          // Optional: Send notification to admin using nodemailer (to be implemented)
          console.log(`[IMAP] Detected reply from Lead: ${lead.email} | Subject: ${subject}`);
        }

        // Mark message as read so we don't process it again
        await connection.addFlags(msg.attributes.uid, ['\\Seen']);
      }
    }

    connection.end();
  } catch (error) {
    console.error(`[IMAP Error] Account ${account.email}:`, error);
  }
}

export async function checkAllInboxes() {
  await connectDB();
  const accounts = await EmailAccount.find({ isActive: true });
  for (const account of accounts) {
    await checkRepliesForAccount(account);
  }
}
